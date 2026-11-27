// Shared test helpers.
// openGame() opens index.html over file:// (the "double-click it" way) with the ?test hook, a seeded Math.random
// and Playwright's clock paused, so the game only moves when a test calls tick(). That makes every run identical.
import { test as base, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export { expect };
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const gameURL = pathToFileURL(path.join(root, 'index.html')).href;

/** Folder for screenshots: tests/shots/<project>/ (gitignored). Look at them after any visual change. */
export function shotsDir(testInfo) {
  const dir = path.join(root, 'tests', 'shots', testInfo.project.name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Draws the current frame (the paused clock means nothing else does), then saves tests/shots/<project>/<name>.png. */
export async function shot(page, testInfo, name) {
  await page.evaluate(() => window.__t?.draw());
  await page.screenshot({ path: path.join(shotsDir(testInfo), `${name}.png`) });
}

// WebKit won't read manifest.webmanifest over file:// ("Origin null is not allowed"). It only matters on the real
// https site, where it works, so that one failure is ignored. Any other failed request (a font, a script) still fails.
const fileQuirk = (url, text) =>
  url.startsWith('file:') && /manifest\.webmanifest$/.test(url) && /Origin null/.test(text);

/** Every test fails if the page throws, logs an error, or a file it needs fails to load. */
export const test = base.extend({
  pageErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('requestfailed', r => {
        if (!fileQuirk(r.url(), r.failure()?.errorText || '')) errors.push(`failed to load ${r.url()}`);
      });
      page.on('console', m => {
        if (m.type() !== 'error') return;
        // The manifest quirk logs twice, once without a URL; requestfailed above still catches any other file.
        if (/Origin null is not allowed by Access-Control-Allow-Origin/.test(m.text())) return;
        // Playwright adds a <style> tag to the page for every WebKit screenshot, and the game's CSP blocks it.
        // The game itself never adds <style> tags; ui.spec.mjs checks for real CSP violations without screenshots.
        if (/^Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline'/.test(m.text())) return;
        errors.push(m.text());
      });
      await use(errors);
      expect(errors, 'errors in the page').toEqual([]);
    },
    { auto: true },
  ],
});

/** A small seeded random number generator that replaces Math.random in the page. Its state can be saved and restored. */
function seedRandom(seed) {
  const rng = { s: seed >>> 0 };
  window.__rng = rng;
  Math.random = () => {
    rng.s = (rng.s + 0x6d2b79f5) >>> 0;
    let t = rng.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Opens the game. Options:
 *  seed:   Math.random seed (default 1)
 *  query:  URL query (default '?test', which turns on the window.__t test hook)
 *  paused: pause the clock so nothing moves until tick() (default true)
 *  url:    open this address instead of the local file (used for the http:// checks)
 */
export async function openGame(page, { seed = 1, query = '?test', paused = true, url = gameURL } = {}) {
  await page.addInitScript(seedRandom, seed);
  await page.clock.install();
  await page.goto(url + query);
  if (query.includes('test')) await page.waitForFunction(() => !!window.__t);
  if (paused) await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  return page;
}

/** Runs the game for n frames (60 frames = 1 second of game time), then draws one frame so screenshots are current. */
export async function tick(page, n = 1) {
  await page.evaluate(n => {
    for (let i = 0; i < n; i++) __t.step();
    __t.draw();
  }, n);
}

/** Holds a key (by its KeyboardEvent.code) for n frames, then releases it. */
export async function holdKey(page, code, n) {
  await page.keyboard.down(code);
  await tick(page, n);
  await page.keyboard.up(code);
}

/** Presses and releases a key, then runs n frames. */
export async function tapKey(page, code, n = 1) {
  await page.keyboard.press(code);
  await tick(page, n);
}

/** Reads the game mode: 'title' | 'play' | 'paused' | 'over' | 'win' | 'champ'. */
export const mode = page => page.evaluate(() => __t.mode);
