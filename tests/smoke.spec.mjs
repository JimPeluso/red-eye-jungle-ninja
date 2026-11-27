// Smoke test: the game loads, the Rock Snake works, every level and boss starts, and beating a boss leads on.
// Fast checks that run on every change, in both browsers. The full playthrough is in playthrough.spec.mjs.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import * as espree from 'espree';
import { test, expect, openGame, tick, holdKey, tapKey, shot, mode, root } from './helpers.mjs';

test('no two game files declare the same top-level name (that would blank the game)', () => {
  const seen = {};
  const dupes = [];
  for (const f of readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'))) {
    const ast = espree.parse(readFileSync(path.join(root, 'js', f), 'utf8'), { ecmaVersion: 2022, sourceType: 'script' });
    const names = [];
    for (const n of ast.body) {
      if (n.type === 'VariableDeclaration') n.declarations.forEach(d => d.id.type === 'Identifier' && names.push(d.id.name));
      else if (n.id) names.push(n.id.name);
    }
    for (const name of names) {
      if (seen[name]) dupes.push(`${name} in ${seen[name]} and ${f}`);
      seen[name] = f;
    }
  }
  expect(dupes).toEqual([]);
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

test('every level starts and plays', async ({ page }, testInfo) => {
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
      await tick(page, 4);
    }
    await page.keyboard.up('ArrowRight');
    await shot(page, testInfo, `level-${String(i + 1).padStart(2, '0')}`);
    expect(await page.evaluate(i => __t.li === i && __t.mode === 'play', i), `Level ${i + 1} plays`).toBe(true);
  }
});

test('every boss a level uses starts', async ({ page }, testInfo) => {
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
