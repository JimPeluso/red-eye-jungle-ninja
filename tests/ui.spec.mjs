// Menus, controls, saving and other things a player touches, in both browsers (laptop keyboard and iPad touch).
import { test, expect, openGame, tick, mode } from './helpers.mjs';

test.describe('boss fights', () => {
  for (const [level, ends] of [
    [10, 'win'],
    [23, 'champ'],
  ]) {
    test(`Level ${level}: a spit still in the air when the boss is beaten can't cause Game Over`, async ({ page }) => {
      await openGame(page);
      await page.evaluate(i => {
        __t.startLevel(i);
        __t.startBoss(__t.LEVELS[i].boss);
      }, level - 1);
      await tick(page, 130); // the boss finishes its entrance
      await page.evaluate(() => {
        const p = __t.p;
        p.hearts = 1;
        p.inv = 0;
        __t.spits.push({ x: p.x + 17 + 60, y: p.y + 28, vx: -4, life: 200 }); // venom flying straight at Red Eye
        __t.B.hp = 1;
        __t.bossHit(2); // the winning hit
      });
      for (let t = 0; t < 30 && (await mode(page)) === 'play'; t++) await tick(page, 10);
      expect(await mode(page)).toBe(ends);
    });
  }
});
