// Loads the game's level, boss and palette data in Node (no browser) by running the data files from js/ in a
// sandbox, exactly as the page loads them. levels.spec.mjs checks the result matches what the browser has.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const js = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'js');

export function loadGameData() {
  const fakeCanvas = { getContext: () => ({ createLinearGradient: () => ({ addColorStop() {} }) }) };
  const ctx = vm.createContext({ document: { getElementById: () => fakeCanvas } });
  for (const f of ['core', 'palettes', 'levels', 'bosses', 'scenery'])
    vm.runInContext(readFileSync(path.join(js, `${f}.js`), 'utf8'), ctx, { filename: `js/${f}.js` });
  return JSON.parse(vm.runInContext('JSON.stringify({ LEVELS, BOSSES, PALS, GY, WH, ARENA, arena: arena(0) })', ctx));
}
