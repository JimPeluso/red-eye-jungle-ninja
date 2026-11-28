// Menus, controls, saving and security: the things a player touches, in both browsers (laptop keyboard, iPad touch).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { test, expect, openGame, tick, tapKey, mode, root, gameURL, finishBoss } from './helpers.mjs';

const p = page => page.evaluate(() => JSON.parse(JSON.stringify(__t.p)));
const play = async (page, level = 0) => {
  await page.evaluate(i => {
    __t.startLevel(i);
    __t.p.inv = 1e6;
  }, level);
  await tick(page, 150); // the level banner goes away
};

test.describe('keyboard', () => {
  for (const [codes, check] of [
    [['ArrowRight', 'KeyD'], (a, b) => b.x > a.x + 20],
    [['ArrowLeft', 'KeyA'], (a, b) => b.x < a.x - 20],
    [['Space', 'ArrowUp', 'KeyW'], (a, b) => b.y < a.y - 20],
    [['ArrowDown', 'KeyS'], (a, b) => b.crouch],
    [['KeyZ', 'KeyJ'], (a, b) => b.sw > 0 || b.swcd > 0],
    [['KeyX', 'KeyK'], (a, b) => b.ammo === a.ammo - 1],
  ])
    for (const code of codes)
      test(`${code} works`, async ({ page }) => {
        await openGame(page);
        await play(page);
        await page.evaluate(() => __t.respawnAt(1500, 460));
        await tick(page, 5);
        const before = await p(page);
        await page.keyboard.down(code);
        await tick(page, 10);
        const after = await p(page);
        await page.keyboard.up(code);
        expect(check(before, after)).toBe(true);
      });

  for (const [code, used] of [
    ['KeyC', 'Thunder Strike'],
    ['KeyL', 'Thunder Strike'],
    ['KeyV', 'Shadow Clones'],
  ])
    test(`${code} uses ${used} when the meter is full`, async ({ page }) => {
      await openGame(page);
      await play(page);
      await page.evaluate(() => (__t.p.sp = 100));
      await tapKey(page, code, 2);
      expect((await p(page)).sp).toBe(0);
    });

  test('P and Escape pause and resume; Enter and Space work the menus', async ({ page }) => {
    await openGame(page);
    await page.keyboard.press('Enter');
    expect(await mode(page)).toBe('play');
    for (const code of ['KeyP', 'Escape']) {
      await page.keyboard.press(code);
      expect(await mode(page)).toBe('paused');
      await expect(page.locator('#paused')).toBeVisible();
      await page.keyboard.press(code);
      expect(await mode(page)).toBe('play');
    }
    await page.keyboard.press('KeyP');
    await page.keyboard.press('Space');
    expect(await mode(page), 'Space resumes from the pause screen').toBe('play');
  });
});

test.describe('touch buttons (iPad)', () => {
  test.beforeEach(({}, testInfo) => test.skip(!testInfo.project.use.hasTouch, 'touch screens only'));

  // Holds (down) or lets go of (up) an on-screen button, like a finger would. id = which finger.
  const finger = async (page, selector, type, id = 1) => {
    const box = await page.locator(selector).boundingBox();
    await page.locator(selector).dispatchEvent(`pointer${type}`, {
      pointerId: id,
      pointerType: 'touch',
      isPrimary: id === 1,
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
    });
  };
  const start = async page => {
    await openGame(page);
    // Real taps, by position (locator.tap() waits for animation frames, which the paused clock never sends).
    await page.touchscreen.tap(8, 760); // the first touch (an empty corner) shows the touch buttons
    const play = await page.locator('#goT').boundingBox();
    await page.touchscreen.tap(play.x + play.width / 2, play.y + play.height / 2);
    await tick(page, 150);
    await page.evaluate(() => {
      __t.respawnAt(1500, 460);
      __t.p.inv = 1e6;
    });
    await tick(page, 5);
    await expect(page.locator('#padL')).toBeVisible();
    await expect(page.locator('#padR')).toBeVisible();
  };

  test('Right and Left run, and sliding a thumb from Left to Right switches direction', async ({ page }) => {
    await start(page);
    const x0 = (await p(page)).x;
    await finger(page, '#padL [data-k=R]', 'down');
    await tick(page, 20);
    expect((await p(page)).x).toBeGreaterThan(x0 + 20);
    await finger(page, '#padL [data-k=R]', 'up');
    await finger(page, '#padL [data-k=L]', 'down', 2);
    await tick(page, 20);
    expect((await p(page)).vx, 'running left').toBeLessThan(-2);
    await finger(page, '#padL [data-k=R]', 'move', 2); // slide the same thumb onto Right
    await tick(page, 20);
    expect((await p(page)).vx, 'now running right').toBeGreaterThan(2);
    await finger(page, '#padL [data-k=R]', 'up', 2);
    await tick(page, 20);
    expect(Math.abs((await p(page)).vx), 'stops when the thumb lifts').toBeLessThan(0.5);
  });

  test('Sneak, Jump, Sword and Star', async ({ page }) => {
    await start(page);
    await finger(page, '#padL [data-k=D]', 'down');
    await tick(page, 3);
    expect((await p(page)).crouch).toBe(true);
    await finger(page, '#padL [data-k=D]', 'up');
    await tick(page, 3);
    const y0 = (await p(page)).y;
    await finger(page, '#bJ', 'down');
    await tick(page, 8);
    expect((await p(page)).y).toBeLessThan(y0 - 30);
    await finger(page, '#bJ', 'up');
    await tick(page, 60);
    await finger(page, '#bS', 'down');
    await tick(page, 2);
    expect((await p(page)).sw).toBeGreaterThan(0);
    await finger(page, '#bS', 'up');
    const ammo = (await p(page)).ammo;
    await finger(page, '#bT', 'down');
    await tick(page, 2);
    await finger(page, '#bT', 'up');
    expect((await p(page)).ammo).toBe(ammo - 1);
  });

  test('Super and Clones light up when the meter is full, and work', async ({ page }) => {
    await start(page);
    await expect(page.locator('#bU')).not.toHaveClass(/ready/);
    await page.evaluate(() => (__t.p.sp = 100));
    await tick(page, 1);
    await expect(page.locator('#bU')).toHaveClass(/ready/);
    await expect(page.locator('#bV')).toHaveClass(/ready/);
    await finger(page, '#bV', 'down');
    await tick(page, 2);
    await finger(page, '#bV', 'up');
    expect((await p(page)).sp, 'Shadow Clones used the meter').toBe(0);
  });

  test('switching apps lets go of every button', async ({ page }) => {
    await start(page);
    await finger(page, '#padL [data-k=R]', 'down');
    await tick(page, 5);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await mode(page)).toBe('paused');
    expect(await page.evaluate(() => Object.values(__t.tch).some(Boolean)), 'no button still held').toBe(false);
  });

  // A finger at an exact screen spot (x, y) on a pad: down, move or up.
  const touchAt = (page, pad, type, x, y, id = 1) =>
    page.locator(pad).dispatchEvent(`pointer${type}`, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y });
  const centreOf = async (page, selector) => {
    const b = await page.locator(selector).boundingBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };

  test('sliding a thumb along the arrows never sneaks, and one thumb can sneak-walk', async ({ page }) => {
    await start(page);
    const L = await centreOf(page, '#padL [data-k=L]');
    const R = await centreOf(page, '#padL [data-k=R]');
    const D = await centreOf(page, '#padL [data-k=D]');
    await touchAt(page, '#padL', 'down', L.x, L.y);
    for (let i = 0; i <= 20; i++) {
      await touchAt(page, '#padL', 'move', L.x + ((R.x - L.x) * i) / 20, L.y);
      expect(await page.evaluate(() => __t.tch.D), `no sneaking at step ${i} of the slide`).toBe(0);
    }
    expect(await page.evaluate(() => __t.tch.R)).toBe(1);
    await touchAt(page, '#padL', 'up', R.x, R.y);
    // thumb between Sneak and Right, in the tall grass of Level 1: crouched, moving right, hidden
    await page.evaluate(() => __t.respawnAt(1650, 460));
    await tick(page, 3);
    const x0 = (await p(page)).x;
    await touchAt(page, '#padL', 'down', R.x, D.y);
    await tick(page, 30);
    const after = await p(page);
    expect([after.crouch, after.hidden, after.x > x0 + 30]).toEqual([true, true, true]);
    await touchAt(page, '#padL', 'up', R.x, D.y);
  });

  test('every spot in the right-hand area presses a button (no dead spots)', async ({ page }) => {
    await start(page);
    // The same pointer events a finger sends, every 8px across the pad, sent from inside the page in one go.
    const dead = await page.evaluate(() => {
      const pad = document.getElementById('padR');
      const box = pad.getBoundingClientRect();
      const send = (type, x, y) =>
        pad.dispatchEvent(
          new PointerEvent(`pointer${type}`, {
            pointerId: 9,
            pointerType: 'touch',
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
      const out = [];
      for (let x = box.left + 2; x < box.right; x += 8)
        for (let y = box.top + 2; y < box.bottom; y += 8) {
          send('down', x, y);
          if (!'JSTUV'.split('').some(k => __t.tch[k])) out.push(`${x | 0},${y | 0}`);
          send('up', x, y);
        }
      return out;
    });
    expect(dead).toEqual([]);
  });

  test('rolling a thumb from Sword onto Jump jumps, and between them does both', async ({ page }) => {
    await start(page);
    const S = await centreOf(page, '#bS');
    const J = await centreOf(page, '#bJ');
    await touchAt(page, '#padR', 'down', S.x, S.y);
    await tick(page, 1);
    for (let i = 1; i <= 6; i++) await touchAt(page, '#padR', 'move', S.x + ((J.x - S.x) * i) / 6, S.y);
    await tick(page, 3);
    expect((await p(page)).vy, 'jumping after the roll').toBeLessThan(0);
    await touchAt(page, '#padR', 'up', J.x, J.y);
    await tick(page, 60);
    await touchAt(page, '#padR', 'down', (S.x + J.x) / 2, (S.y + J.y) / 2);
    await tick(page, 3);
    const both = await p(page);
    expect([both.sw > 0, both.vy < 0], 'sword swing and jump together').toEqual([true, true]);
    await touchAt(page, '#padR', 'up', J.x, J.y);
  });

  test('on touch, a jump pressed a little late after running off an edge still works (not on the keyboard)', async ({
    page,
  }) => {
    await start(page);
    // Level 1's first gap starts at x=900. Run off it, wait 8 frames, then press Jump.
    const lateJump = async touch => {
      await page.evaluate(() => {
        __t.respawnAt(700, 460);
        __t.p.inv = 1e6;
      });
      await tick(page, 3);
      if (touch) await finger(page, '#padL [data-k=R]', 'down');
      else await page.keyboard.down('ArrowRight');
      await page.evaluate(() => {
        for (let i = 0; i < 300 && __t.p.on; i++) __t.step();
      });
      await tick(page, 7);
      if (touch) await finger(page, '#bJ', 'down', 2);
      else await page.keyboard.down('Space');
      await tick(page, 2);
      const jumped = (await p(page)).vy < 0;
      if (touch) {
        await finger(page, '#bJ', 'up', 2);
        await finger(page, '#padL [data-k=R]', 'up');
      } else {
        await page.keyboard.up('Space');
        await page.keyboard.up('ArrowRight');
      }
      return jumped;
    };
    expect(await lateJump(true), 'touch').toBe(true);
    expect(await lateJump(false), 'keyboard keeps its tighter timing').toBe(false);
  });

  test('touch buttons only show while playing, and stay clear of the bottom edge', async ({ page }) => {
    await openGame(page);
    await page.touchscreen.tap(8, 760);
    await expect(page.locator('#padL')).toBeHidden();
    await page.evaluate(() => __t.startLevel(0));
    await expect(page.locator('#padL')).toBeVisible();
    const lowest = await page.evaluate(() =>
      Math.max(...[...document.querySelectorAll('.pad .b')].map(b => b.getBoundingClientRect().bottom)),
    );
    expect(page.viewportSize().height - lowest).toBeGreaterThanOrEqual(24);
  });
});

test.describe('game controller', () => {
  // A pretend Bluetooth controller (standard mapping), so the Gamepad API code can be tested without one.
  const usePad = page =>
    page.addInitScript(() => {
      const pad = {
        id: 'Test controller (STANDARD GAMEPAD)',
        index: 0,
        connected: true,
        mapping: 'standard',
        timestamp: 0,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      };
      window.__pad = pad;
      Object.defineProperty(navigator, 'getGamepads', { value: () => [pad, null, null, null], configurable: true });
    });
  // Sets which buttons are held and where the left stick is, then lets the game read the controller.
  const padInput = (page, held = [], axes = [0, 0]) =>
    page.evaluate(
      ({ held, axes }) => {
        window.__pad.buttons.forEach((b, i) => (b.pressed = held.includes(i)));
        window.__pad.axes[0] = axes[0];
        window.__pad.axes[1] = axes[1];
        __t.pollPad();
      },
      { held, axes },
    );
  const A = 0,
    B = 1,
    X = 2,
    Y = 3,
    RB = 5,
    START = 9,
    DOWN = 13;

  test('A starts the game, Start pauses and resumes', async ({ page }) => {
    await usePad(page);
    await openGame(page);
    await padInput(page, [A]);
    await padInput(page);
    expect(await page.evaluate(() => [__t.mode, __t.li])).toEqual(['play', 0]);
    await padInput(page, [START]);
    await padInput(page);
    expect(await mode(page)).toBe('paused');
    await padInput(page, [START]);
    await padInput(page);
    expect(await mode(page)).toBe('play');
  });

  test('stick to run, A jumps, down sneaks, X sword, B star, Y Thunder Strike, RB Shadow Clones', async ({ page }) => {
    await usePad(page);
    await openGame(page);
    await play(page);
    await page.evaluate(() => __t.respawnAt(1500, 460));
    await tick(page, 3);
    const x0 = (await p(page)).x;
    await padInput(page, [], [1, 0]);
    await tick(page, 15);
    expect((await p(page)).x, 'stick right runs right').toBeGreaterThan(x0 + 30);
    await padInput(page, [A], [1, 0]);
    await tick(page, 4);
    expect((await p(page)).vy, 'A jumps').toBeLessThan(0);
    await padInput(page);
    await tick(page, 60);
    await padInput(page, [DOWN]);
    await tick(page, 2);
    expect((await p(page)).crouch, 'd-pad down sneaks').toBe(true);
    await padInput(page, [X]);
    await tick(page, 2);
    expect((await p(page)).sw, 'X swings the sword').toBeGreaterThan(0);
    const ammo = (await p(page)).ammo;
    await padInput(page, [B]);
    await tick(page, 2);
    expect((await p(page)).ammo, 'B throws a star').toBe(ammo - 1);
    await page.evaluate(() => (__t.p.sp = 100));
    await padInput(page, [Y]);
    await tick(page, 2);
    expect((await p(page)).sp, 'Y uses Thunder Strike').toBe(0);
    await page.evaluate(() => (__t.p.sp = 100));
    await padInput(page, [RB]);
    await tick(page, 2);
    expect((await p(page)).sp, 'RB uses Shadow Clones').toBe(0);
    await padInput(page);
  });

  test('using a controller hides the touch buttons', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'touch screens only');
    await usePad(page);
    await openGame(page);
    await page.touchscreen.tap(8, 760);
    await play(page);
    await expect(page.locator('#padR')).toBeVisible();
    await padInput(page, [X]);
    await expect(page.locator('#padR')).toBeHidden();
  });
});

test('the game pauses when the tab is hidden', async ({ page }) => {
  await openGame(page);
  await play(page);
  await page.keyboard.down('ArrowRight');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await mode(page)).toBe('paused');
  expect(await page.evaluate(() => __t.key.R), 'the held key is let go').toBe(0);
  await page.keyboard.up('ArrowRight');
});

test.describe('saving', () => {
  test('sound on/off is remembered after a reload', async ({ page }) => {
    await openGame(page);
    await expect(page.locator('#sOn')).toBeVisible();
    await page.locator('#snd').click();
    await expect(page.locator('#sOff')).toBeVisible();
    await expect(page.locator('#sOn')).toBeHidden();
    await expect(page.locator('#snd')).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await page.waitForFunction(() => !!window.__t);
    await expect(page.locator('#sOff')).toBeVisible();
    await expect(page.locator('#sOn')).toBeHidden();
  });

  test('beating a level unlocks the next one, and that survives a reload', async ({ page }) => {
    await openGame(page);
    await expect(page.locator('.chip:not([disabled])')).toHaveCount(1);
    await page.evaluate(() => {
      __t.startLevel(0);
      __t.startBoss(__t.LEVELS[0].boss);
    });
    await tick(page, 130);
    await page.evaluate(() => {
      __t.B.hp = 1;
      __t.bossHit(2);
    });
    await finishBoss(page);
    expect(await mode(page)).toBe('win');
    await page.locator('#goW2').click(); // play this level again
    await page.keyboard.press('Escape');
    await page.locator('#goQ').click(); // quit to title
    await expect(page.locator('.chip:not([disabled])')).toHaveCount(2);
    await page.reload();
    await page.waitForFunction(() => !!window.__t);
    await expect(page.locator('.chip:not([disabled])')).toHaveCount(2);
    await page.locator('.chip[data-i="1"]').click();
    expect(await page.evaluate(() => [__t.li, __t.mode])).toEqual([1, 'play']);
  });

  for (const [saved, open] of [
    ['abc', 1],
    ['-5', 1],
    ['3.7', 4],
    ['999', 23],
    ['<img src=x onerror=alert(1)>', 1],
  ])
    test(`a tampered save ("${saved}") can't break anything`, async ({ page }) => {
      await page.addInitScript(v => localStorage.setItem('redeye-unlock', v), saved);
      await openGame(page);
      await expect(page.locator('.chip:not([disabled])')).toHaveCount(open);
    });
});

test.describe('game over', () => {
  test('"Try again" in a level goes back to the last checkpoint with full hearts', async ({ page }) => {
    await openGame(page);
    await play(page);
    await page.evaluate(() => {
      const p = __t.p;
      p.cp = { x: 2120, y: 460 };
      p.hearts = 1;
      p.inv = 0;
      __t.spits.push({ x: p.x + 17 + 40, y: p.y + 28, vx: -4, life: 200 });
    });
    for (let t = 0; t < 20 && (await mode(page)) === 'play'; t++) await tick(page, 10);
    expect(await mode(page)).toBe('over');
    await page.locator('#goO').click();
    const after = await p(page);
    expect([await mode(page), after.hearts, Math.round(after.x)]).toEqual(['play', 6, 2120]);
  });

  test('"Try again" in a boss fight restarts the fight', async ({ page }) => {
    await openGame(page);
    await page.evaluate(() => {
      __t.startLevel(0);
      __t.startBoss(__t.LEVELS[0].boss);
    });
    await tick(page, 130);
    await page.evaluate(() => {
      __t.B.hp = 5;
      const p = __t.p;
      p.hearts = 1;
      p.inv = 0;
      __t.spits.push({ x: p.x + 17 + 40, y: p.y + 28, vx: -4, life: 200 });
    });
    for (let t = 0; t < 20 && (await mode(page)) === 'play'; t++) await tick(page, 10);
    expect(await mode(page)).toBe('over');
    await page.locator('#goO').click();
    expect(await page.evaluate(() => [__t.mode, __t.B.hp === __t.B.max, __t.p.hearts])).toEqual(['play', true, 6]);
  });
});

test('the level chips and the title match the number of levels', async ({ page }) => {
  await openGame(page);
  const n = await page.evaluate(() => __t.LEVELS.length);
  await expect(page.locator('.chip')).toHaveCount(n);
  await expect(page.locator('#title .lvl')).toContainText(`${n} levels`);
});

test('the HUD shows hearts, coins and stars', async ({ page }) => {
  await openGame(page);
  await play(page);
  await page.evaluate(() => Object.assign(__t.p, { hearts: 3, coins: 42, ammo: 2 }));
  await tick(page, 1);
  await expect(page.locator('#hc')).toHaveText('42');
  await expect(page.locator('#ha')).toHaveText('2');
  await expect(page.locator('#hearts svg:not(.off)')).toHaveCount(3);
});

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
      for (let t = 0; t < 40 && (await mode(page)) === 'play'; t++) await tick(page, 10); // the big finish
      expect(await mode(page)).toBe(ends);
    });
  }
});

test.describe('security', () => {
  test('the page only loads its own files and breaks no Content-Security-Policy rule', async ({ page }) => {
    const elsewhere = [];
    page.on('request', r => {
      if (!r.url().startsWith('file://') && !r.url().startsWith('data:')) elsewhere.push(r.url());
    });
    await page.addInitScript(() => {
      window.__csp = [];
      document.addEventListener('securitypolicyviolation', e =>
        window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
      );
    });
    await openGame(page);
    await page.locator('#goT').click();
    await page.keyboard.down('ArrowRight');
    for (let i = 0; i < 10; i++) await tapKey(page, i % 2 ? 'Space' : 'KeyZ', 10);
    await page.keyboard.up('ArrowRight');
    await page.evaluate(() => __t.startBoss(__t.LEVELS[0].boss));
    await tick(page, 200);
    expect(elsewhere, 'requests to other websites').toEqual([]);
    expect(await page.evaluate(() => window.__csp), 'CSP violations').toEqual([]);
    expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toContain(
      "default-src 'none'",
    );
  });

  test('the ?test hook exists on this computer but not on any other address', async ({ page }) => {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
    const server = createServer(async (req, res) => {
      const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!file.startsWith(root)) return res.writeHead(403).end();
      try {
        res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
        res.end(await readFile(file));
      } catch {
        res.writeHead(404).end();
      }
    }).listen(0);
    await new Promise(r => server.once('listening', r));
    const port = server.address().port;
    const lan = Object.values(networkInterfaces())
      .flat()
      .find(i => i.family === 'IPv4' && !i.internal)?.address;
    try {
      await page.goto(`${gameURL}?test`);
      expect(await page.evaluate(() => !!window.__t), 'file://').toBe(true);
      await page.goto(`http://127.0.0.1:${port}/index.html?test`);
      expect(await page.evaluate(() => !!window.__t), 'localhost').toBe(true);
      test.skip(!lan, 'no network address to test with');
      await page.goto(`http://${lan}:${port}/index.html?test`);
      await page.waitForFunction(() => document.readyState === 'complete');
      expect(await page.evaluate(() => typeof window.__t), `http://${lan} (like the live site)`).toBe('undefined');
      expect(await page.evaluate(() => typeof window.step), 'the game itself still runs there').toBe('function');
    } finally {
      server.close();
    }
  });
});
