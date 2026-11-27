# Red Eye: Jungle Ninja — project notes for Claude

Red Eye is a ninja with a red headband fighting snakes in a jungle. It's a side-scrolling, Mario-style platformer that runs in the browser. There are 23 levels, and each one ends with a giant cobra boss. Master Fang rides his cobra on Level 10, and the Spike King is the final boss on Level 23.

- **Who's who.** The **game designer is a 10-year-old boy**: the ideas, names and rules are his. His dad (the repo owner) runs the project, builds it with Claude and reviews the code.
- **Where it's played.** Mostly on an **iPad in landscape** with the on-screen touch buttons, sometimes on a laptop with the keyboard.
- **Play link.** <https://jimpeluso.github.io/red-eye-jungle-ninja/> (GitHub Pages, deployed by CI from `main` once the tests pass).
- **The repo is public.** Never put the kid's name, photos, school or any other personal details into code, commits or docs.

---

## 1. Working with the designer (read this first)

**He types short, misspelled requests.** Read them generously. Real examples:

| He typed | Meant |
|---|---|
| `relistek`, `relistec` | realistic (art style) |
| `eser` | easier |
| `ningas`, `nigas` | ninjas |
| `snaks`, `snak` | snakes, snake |
| `harts`, `haerts` | hearts |
| `leves`, `levls` | levels |
| `heath` | health |
| `dol` | duel |
| `spon` | spawn |
| `sice` | size |
| `miny boss` | mini-boss |
| `brind back master fand` | bring back Master Fang |
| `- enmes heath 40` | enemies have 40% less health |

**He answers with numbers.** If a request is ambiguous, offer **2–4 short numbered options** in kid language and he'll reply "2". If it's clear, just do it; don't quiz him.

**He changes his mind a lot.** Each of these has flipped back and forth at least once:

- Master Fang removed, added, moved and removed again, then brought back on Level 10 riding his cobra.
- Ice snakes and ice balls added, then removed.
- Giant snakes, then back to normal size.
- "Realistic" art at 40% and 100%, then reverted to cartoon.
- Evil ninjas added, then removed.

So:

- **Do big or risky changes on a branch** (art style, enemy rework) and only merge when he's happy. A revert should be one command.
- **Don't rip out code that might come back.** Switch it off and keep it: the sword duel (`js/duel.js`), the evil ninja drawing and the ice bits are still in the code, dormant.
- When he removes something, check the whole game for leftovers: title text, win/champion text, signs and level-select chips.

**How to reply** (when he's the one asking):

- Short and excited.
- Say **where to find the new thing** ("Level 7!") and **how to beat it**.
- If something affects Dad (saved progress resets, layouts reshuffle, a setting to change), add one line starting **"For Dad:"**.

**His original vision**, from the first interview (still the north star):

- adventure, ninja hero, jungle setting, stop the bad guy
- villains are giant snakes
- fights with a mix of sword, throwing stars and sneaking
- runs and jumps side to side like Mario
- collects coins, and **coins should buy new stuff in a shop**. The shop isn't built yet; it's the biggest unbuilt feature.

He also once mentioned his own snake idea (option "4") but never described it. Ask him about it if snakes come up.

---

## 2. Run, test, ship

There's **no build step**.

**Node is never installed on the Mac.** Dad wants the Mac kept clean, so every npm, Node, ESLint, Prettier and Playwright command runs in the dev container (`compose.yaml`, the official Playwright image) through the `./dev` script. Don't `brew install node` or run `npm` directly on the Mac. git and `gh` run on the Mac as usual.

**One-time setup**
- Docker Desktop must be running (`open -a Docker`).
- `./dev npm run setup` installs the packages and the test browsers into Docker volumes, not the repo folder (`node_modules/` on the Mac stays an empty mount point).
- VS Code can also "Reopen in Container" (`.devcontainer/`).
- To remove it all: `docker compose down -v`, then delete the image in Docker Desktop.

**Run it**
- Double-click `index.html`, or `./dev npm run serve` and go to <http://localhost:8000>.
- To try it on the iPad before pushing: serve it and open `http://<laptop-ip>:8000` on the same Wi-Fi.

**Test it**
- `./dev npm test` runs everything (about 3 minutes): Chromium as a laptop with a keyboard, and WebKit (Safari's engine) as an iPad in landscape.
- `./dev npm run lint` runs ESLint. `./dev npm run format` runs Prettier (CI runs `format:check` and fails on unformatted code).

| Test file | What it checks |
|---|---|
| `tests/smoke.spec.mjs` | Quick checks: the Rock Snake, the burrowing bosses (Ember, Shadow) go underground, burst up and can be hit while dazed, every level and boss starts, level flow (Master Fang → Level 11, final boss → "You beat the game!"), no two files declare the same top-level name. |
| `tests/levels.spec.mjs` | The **level model** (below), one test per level: the boss gate can be reached, no dead ends, every coin, pouch and heart can be collected, checkpoints are safe, no snake patrols over a pit, sign text fits, builder rules. |
| `tests/playthrough.spec.mjs` | A **bot** plays the real game from the title to "You beat the game!" and beats every boss with real hits. It also checks the model against the engine: both say the widest jumpable gap is 244px. |
| `tests/mad.spec.mjs` | Mad moves: Vine Grab only once mad and then every 3rd attack, the warning lasts at least 45 frames, standing still gets hit, stepping off dodges, the dazed boss can be hit. |
| `tests/snakes.spec.mjs` | The newer snakes (11-15): each one's warning, attack and how it's beaten, that they're placed in the levels, and a "snake zoo" screenshot. |
| `tests/save.spec.mjs` | Save and Continue: the checkpoint round trip, next level after a clear, leaving mid-boss, New game, beating the game clears the save, broken and tampered saves. |
| `tests/ui.spec.mjs` | Every key; the iPad touch pads (no dead spots, sliding never sneaks, one-thumb sneak-walk, Sword-to-Jump roll and jump attack, touch timing help); the game controller (a pretend one); pause, saving, tampered saves, Game Over → Try again, the HUD, the boss-defeat regression, and security (no outside requests, no CSP violations, no test hook on the live site). |

- Every test fails on any page error or failed file load.
- Tests use a seeded `Math.random` and Playwright's clock paused, so runs are identical. `tick(page, n)` in `tests/helpers.mjs` moves the game n frames (60 = 1 second).
- Screenshots go to `tests/shots/<browser>/` (gitignored). **Look at them after any visual change.** Tests prove things work, not that they look right.
- The `?test` hook, `window.__t`, only exists when the page is opened from a local file or `localhost`, never on the live site. It has getters for `p`, `snakes`, `B`, `mode`, `li`, `LT`, `spits` and `waves`, the `key` and `tch` inputs, and `LEVELS`, `BOSSES`, `PALS`, `mkSnake`, `startLevel`, `startBoss`, `respawnAt`, `bossHit`, `unlocked`, `step` and `draw`.

**The level model** (`tests/model/`)
- `measure.mjs` records Red Eye's jumps and falls frame by frame from the real `step()`, so changes to jumping or running are picked up automatically.
- `reach.mjs` uses those with the landing rules of `step.js` (one-way logs, moving logs, which surface catches him first, coyote jumps, pit walls) to find every surface he can reach and everything he can collect. If you change the landing rules in `step.js`, update `reach.mjs` to match.
- `bot.mjs` follows the model's map in the real engine: it tries a jump, checks where Red Eye actually landed, and rewinds if it went wrong.
- When a level change breaks a test, the message names the level and the problem, e.g. "coin 12 at (1450, 300)". **Level fixes are the designer's call:** show him the problem and offer options.

**Ship it**
- Push to `main` (or merge a pull request). CI (`.github/workflows/ci.yml`) runs lint, the format check and every test. If they pass, it deploys **only the game files** (`index.html`, `manifest.webmanifest`, `css/`, `js/`, `fonts/`, `icons/`) to GitHub Pages, about 5 minutes after the push.
- If CI fails, nothing is deployed and the iPad keeps the last good version.
- On the iPad, "Add to Home Screen" makes it a full-screen app (via `manifest.webmanifest` and the `icons/` folder).
- **Dependabot** opens update pull requests on Mondays for the test tools, the GitHub Actions and the container image. Minor and patch updates to the npm tools merge themselves once CI passes. Everything else waits for Dad.
- The `main` branch blocks force-pushes and deletion, and requires the `test` check on pull requests. Dad (admin) can still push straight to `main`.

**Before every push:** `./dev npm test` passes, and you've looked at the screenshots for anything visual.

---

## 3. How the code is put together

Every file in `js/` is a **plain classic `<script>`**, not a module. They all share **one global scope** and are loaded **in order** by `index.html`. Classic scripts were chosen on purpose so the game still works when you double-click `index.html` (ES modules don't load over `file://`).

Rules that follow from that:

- **Top-level code in a file can only use things from files loaded before it.** Functions can call anything when they run.
- **Never declare the same top-level name in two files.** That's a SyntaxError and the whole game goes blank. ESLint and the smoke test both catch it.
- **Adding a file means adding a `<script>` tag** in the right place in `index.html`.
- **Every file starts with its one-line header comment, then `'use strict';`.**
- ESLint builds each file's allowed globals from the top-level names the other files declare (`eslint.config.mjs`), so a typo in a name fails `./dev npm run lint`. No list to keep up to date.
- Formatting is Prettier (`.prettierrc.json`, 120 columns): one statement per line. Don't hand-compress code. `.git-blame-ignore-revs` hides the one big reformat from `git blame`.

| File | What's in it |
|---|---|
| `js/core.js` | `$`, the canvas `cv`/`ctx`, world constants `WH=580` (world height), `GY=460` (top of the ground), `STEP` (60 fps tick), `ARENA=960` (boss arena width) |
| `js/palettes.js` | `PALS`: the colours of every world |
| `js/levels.js` | Levels 1–10 (hand-made), `genLevel()` and Levels 11–23, `LEVELS`, `arena()` |
| `js/bosses.js` | `BOSSES`: every giant cobra |
| `js/scenery.js` | Coins (Level 1 hand-placed in `CO`, others via `autoCoins`), seeded background scenery, `load(level)` |
| `js/state.js` | Game state variables, helpers (`hit`, `rnd`, `pp`), `mkSnake`, `newPlayer`, `startLevel`, `startBoss`, `go(mode)`, banners, unlocks |
| `js/save.js` | Save and Continue: `saveGame`, `readSave` (checks every saved value), `continueGame`, `clearSave`, `showContinue` (the title screen buttons) |
| `js/effects.js` | Particles (`puff`, `dust`, `sparkle`) and pop-up text (`pop`) |
| `js/sound.js` | All sound effects (`sfx.*`), synthesised with Web Audio. There are no sound files. |
| `js/enemies.js` | `ebox` (hit boxes), `moveSnake` (behaviour per kind), `hitEnemy`, `kill`, `gain` (super meter) |
| `js/player.js` | Shadow Clones, Thunder Strike, `hurt`, `fallen`, `over`, `levelClear`, `champ` |
| `js/mad.js` | Mad moves: `MAD` (each boss's extra attack once it's mad), `getMad`, `startMad`, the dazed state, and ground spots (`zones`: warn, then erupt; also the Fire Snake's flames) |
| `js/snake-kinds.js` | The newer snakes, kinds 11-15: `moveNewSnake`, `shieldFront`, `ghostFaded`, `clangOff` |
| `js/boss.js` | Giant cobra AI: `pickAttack`, `summon`, `bossHit`, `bossStep` state machine |
| `js/duel.js` | Master Fang sword duel. **Not used** (he said "no duel"); kept switchable. |
| `js/step.js` | `step()`, one game tick: input, physics, collisions, enemies, items, camera |
| `js/draw-world.js` | Drawing helpers (`rr`, `circle`, `ell`), trees, ground, water/lava/clouds, logs, signs, lanterns, gate, coins, items |
| `js/draw-enemies.js` | `snake()` and the special snakes (`drawRock`, `twoHead`, flying wings) |
| `js/draw-ninjas.js` | `fig()` (any ninja), `ninja()` (Red Eye), `fang()`, plus dormant evil-ninja and duel drawing |
| `js/draw-mad.js` | Drawing ground spots: Moss's rustling leaves and vines, the Fire Snake's flames |
| `js/draw-snake-kinds.js` | Drawing the newer snakes: their colours (`NEW_SKIN`), the hanging Drop Snake, the coiling Spring Snake, flame crests, shields, ghost fading |
| `js/draw-boss.js` | The giant cobra body and head, temple walls and torches |
| `js/render.js` | Lightning bolts, health bars, shock waves, grass, then `world()` and `render()` |
| `js/main.js` | `resize`, `hud`, the main loop, keyboard, touch and game-controller input, buttons, start-up, the `?test` hook |

**Coordinates and camera**
- The world is 580 units tall, and the top of the ground is `GY=460`. The canvas is scaled by `sc` to fit the screen.
- `cam` is the camera's x position. `TOP` is the top of the visible area in world units; it goes negative on tall screens, so draw sky and canopy from `TOP`, not 0.
- Draw world things in world coordinates. The HUD is HTML, not canvas.

**Loop**
- `frame()` runs `step()` at a fixed 60 Hz using an accumulator, then `render()` once per animation frame.
- **All timers count frames** (60 = 1 second). That keeps game speed the same even when an iPad drops frames.

**Modes and level flow**
- `mode` is one of `'title' | 'play' | 'paused' | 'over' | 'win' | 'champ'`, and `go(m)` shows the matching screen.
- A normal level runs: `startLevel(i)` → walk past `L.gate` → `startBoss(L.boss)` in `arena(k)`.
- When the boss is beaten, `levelClear()` shows the win screen and unlocks the next level. If the boss has `final:true`, `champ()` shows the "You beat the game!" screen instead.
- During a boss fight, `boss` is `true` and `B` holds the fight state (`B.cfg` is the `BOSSES` entry).

**Saved data** (in `localStorage`, always wrapped in try/catch)
- `redeye-unlock` is the highest unlocked level index; `redeye-mute` is the sound setting.
- `redeye-save` is the game in progress (`js/save.js`), so the title screen can offer **Continue**.
  - **When it saves:** a level starts; a lantern checkpoint lights; a boss fight starts; a level is cleared (the save then points at the next level's start); the player leaves the app.
  - **What it keeps:** the level, the last checkpoint, hearts, coins, stars, super meter, time, kills and sneak attacks, which snakes are beaten, and which coins, pouches and hearts were taken.
  - **Continue** goes back to the last checkpoint, or the start of a boss fight. Beaten snakes stay beaten, like "Try again" after a Game Over.
  - **New game** starts over and keeps unlocked levels. **Beating the game** clears the save.
  - If a level's snakes, coins or lanterns change, old saves skip the "beaten / taken" lists for that level but keep the rest. A breaking change to the format needs a new `v` number.
- Saves are per web address. The game used to live at a claude.ai artifact link, so unlocks didn't carry over to GitHub Pages.
- Saved values are untrusted (anyone can edit them in their browser): `unlocked()` and `readSave()` check and clamp them, and `tests/ui.spec.mjs` and `tests/save.spec.mjs` check tampered values.

The old claude.ai artifact link is frozen at version 38. Its snapshot/restore code (`window.claude.hot`) was removed from this repo on November 27, 2026.

---

## 4. Data formats

### Levels (`js/levels.js`)

```js
{ name, pal, segs, plats, grass, signs, lant, pouch, sn, end, gate, spit, boss, coins? }
```

| Field | Format | Notes |
|---|---|---|
| `segs` | `[[fromX, toX], …]` | Solid ground. Gaps between them are pits (water, lava or cloud depending on the palette). Falling costs a heart and respawns you. |
| `plats` | `[x, y, width, swingX, swingY, period, phase]` | Logs. If `swingX` or `swingY` is above 0, the log moves (`pp()`) and carries Red Eye. |
| `grass` | `[[fromX, toX], …]` | Tall grass. Crouching in it hides Red Eye. |
| `signs` | `[[x, 'line 1', 'line 2'], …]` | **Keep each line to about 12 characters** or it spills off the sign. |
| `lant` | `[[x, y], …]` | Lanterns, which are checkpoints. |
| `pouch` | `[[x, y], …]` | Throwing-star pouches (+3 stars). |
| `sn` | `[x, patrolFrom, patrolTo, y, speed, kind]` | Snakes (kinds below). `y` is usually `GY`; a smaller `y` puts the snake on a log. |
| `gate` | x | Walking past this starts the boss fight. |
| `end` | x | Right edge of the level. |
| `spit` | frames | Time between spitter shots. Lower means harder. |
| `boss` | index | Index into `BOSSES`. |
| `coins` | optional | Level 1 uses hand-placed `CO`. Every other level gets `autoCoins(L)` from the level shape. |

**Levels 1–10** are hand-made. **Levels 11–23** come from `genLevel({seed, diff, pal, name, s1, s2, boss})`.

How the generator works:
- It's seeded, so the same seed gives the same layout every time.
- `diff` (3–6.2 so far) controls gap width, snake speed, how many snakes there are, and how often spitters fire.
- It always keeps gaps at 260px or less, and any gap over 150px gets a stepping log or a moving log.
- **Changing the generator or its `pool` of snake kinds reshuffles every generated level.** That happened when the Rock Snake was added to `pool`. Run the tests and add a "For Dad:" note.

### Snake kinds (the 6th number in `sn`)

| Kind | Snake | Health | How it works |
|---|---|---|---|
| 0 | Green snake | 1 | Patrols back and forth |
| 1 | Sleeping snake | 1 | Asleep. Sneak up and hit it for an instant **sneak attack** (counted on the win screen). |
| 2 | Orange spitter | 2.2 | Stands still and spits venom (rate set by `L.spit`) |
| 3 | Blue cobra | 2.2 | Rears up taller when it's close |
| 7 | (was the ice snake) | 1 | Now just a green snake; ice was removed |
| 8 | Flying snake | 1 | Hovers about 110px up and swoops down at Red Eye |
| 9 | Two-headed snake | 2.2 | A head at each end that bites in both directions |
| 10 | Rock Snake | 2.2 | Hides as a mossy boulder: sword and stars just go "Clang!". Pops out with a "!" when you get close, chases for about 2.5 seconds, then hides again. Hit it while it's out. |
| 11 | Drop Snake | 2.2 | Hangs head-down from a vine 190px up. When Red Eye comes near it shakes for 30 frames ("!", leaves fall), drops, then races along. |
| 12 | Spring Snake | 2.2 | Coils up for 24 frames ("boing"), then hops at Red Eye in an arc (about 90px up, 100px forward). Stomping works. |
| 13 | Fire Snake | 2.2 | Leaves little flames behind it (ground spots, kind `flame`) that burn for 2 seconds and hurt. Beating it puts them out. |
| 14 | Shield Snake | 2.2 | Sword and stars clang off its front. It takes 40 frames to turn round, so jump over it and hit its back. |
| 15 | Ghost Snake | 2.2 | Fades out and back in (a 200-frame cycle). While faded it can't hurt Red Eye and can't be hit. |
| 4, 5, 6 | (were evil ninjas) | | `mkSnake` turns them into kinds 3, 2 and 0. Level 6 still lists them. |

Kinds 11-15 were added in November 2026 and are placed through the `NEW_SNAKES` list at the end of `js/levels.js` (level number + `sn` entry), so they're easy to move or take out without touching the levels themselves or the generator.

Health 2.2 for the special kinds comes from his rule: "special snakes have 10% more health" than 2 sword hits. Basic snakes take one hit.

**Adding a new snake kind:**
1. In `mkSnake` (state.js), add a flag and its health (special kinds go in `TOUGH`). New kinds' movement goes in `js/snake-kinds.js` and their drawing in `js/draw-snake-kinds.js`.
2. Give it a hit box in `ebox` (enemies.js).
3. Add its behaviour in `moveSnake`.
4. Add any special hit rules in `step()` (step.js). The hidden Rock Snake skip is the example to copy.
5. Draw it in `snake()` (draw-enemies.js) and give it a death-puff colour in `kill`.
6. Place it in levels. Optionally add it to the `genLevel` pool, but read the reshuffle warning above first.
7. Add a check to `tests/smoke.spec.mjs`, like the Rock Snake one. (The level model already checks every snake stands on solid ground.)

### Bosses (`js/bosses.js`)

```js
{ name, sub, pal, hp, minion, atk, col:{o,a,b,h,m,bl}, rider?, spikes?, final?, redEye?, eye?, duel? }
```

| Field | Meaning |
|---|---|
| `atk` | Any of `'lunge'`, `'slam'`, `'spit'`, `'wave'` (ground shock wave), `'spikes'` (shoots spikes), `'summon'` (calls snakes), `'burrow'` (goes underground; see below) |
| `minion` | Snake kind it summons (0–3) |
| `col` | Colours: `o` outline, `a`/`b` body, `h` highlight, `m` hood markings, `bl` belly |
| `rider` | Master Fang sits on its head (his own hit box, and he shouts "Snakes, attack!") |
| `final` | Beating it shows the "You beat the game!" screen |
| `redEye` / `eye` | Eye colour |
| `spikes` | Spiky look |

The hood markings are a ring and a diamond. They once looked like a second pair of eyes, so keep them that way.

**Bosses are referenced by index, so never reorder or delete entries. Add new bosses at the end.**

| Index | Boss | Level | Health |
|---|---|---|---|
| 0 | Moss | 1 | 30 |
| 1 | Thunder | 2 | 35 |
| 2 | Tide | 3 | 40 |
| 3 | Ember (also **burrows**) | 4 | 45 |
| 4 | Shadow (the one that **burrows**) | 5 | 50 |
| 11 | Venom | 6 | 60 |
| 8 | Magma | 7 | 55 |
| 9 | Bog | 8 | 60 |
| 10 | Storm | 9 | 65 |
| **5** | **Master Fang on his giant cobra** (`rider`, attacks: lunge, wave, summon) | **10** | **80** |
| 13 | Rex | 11 | 72 |
| 14 | Dune | 12 | 76 |
| 15 | Crystal | 13 | 80 |
| 16 | Bolt | 14 | 85 |
| 17 | Dusk | 15 | 88 |
| 18 | Splash | 16 | 92 |
| 19 | Spore | 17 | 96 |
| 20 | Nightshade | 18 | 100 |
| 21 | Goldscale | 19 | 104 |
| 22 | Inferno | 20 | 108 |
| 23 | Cyclone | 21 | 112 |
| 24 | Toxic | 22 | 116 |
| **7** | **Spike King** (`final`, shoots spikes) | **23** | **140** |
| 6 | Master Fang sword duel (`duel`) | unused | 100 |
| 12 | Thorn, the castle cobra | unused (Master Fang took Level 10) | 68 |

Boss fight mechanics:
- Every boss has a **phase 2** below half health: faster, more snakes.
- **Mad moves** (`js/mad.js`): a boss with a `mad` field gets mad at phase 2. A banner names the move ("Moss is mad! Vine Grab!"), the move comes straight away, then every 3rd attack. So far only **Moss: Vine Grab** (`mad: 'vines'`): leaves rustle on two patches, one under Red Eye, then vines shoot up. Ideas for the other bosses are in the `mad-moves` pull request.
- **Fair-play rules for mad moves** (keep them): at least 45 frames (0.75 s) of warning; one clear way to dodge; 1 heart of damage; no flashing; afterwards the boss is **dazed** (head down near Red Eye) and can be hit. `tests/mad.spec.mjs` checks the warning, the dodge and the dazed hit.
- **Burrow** (Ember on Level 4 and Shadow on Level 5; his idea: "cave snake can go underground", then "a snake on Level 4 too"). The sequence:
  1. `dive`: the cobra sinks into the ground.
  2. `under`: a dirt mound, with the cobra's back poking out, chases Red Eye.
  3. `rumble`: it stops under him with a "!" and red eyes in the crack. That's the warning to move.
  4. `burst`: the head erupts out of a hole and hurts him if he's standing on it.
  5. `dazed`: the head lies on the ground with stars, and **can be hit** like `stuck`.
  6. `redive` and `rise`: it sinks back and comes up at its usual spot.

  State lives on `B`: `ug` (underground), `sink` (0 to 1), `mx` (mound x), `hole` (x of the hole). The drawing is `underground()`, `burrowBack()`, `burrowNeck()` and `burrowFront()` in draw-boss.js, which clip the cobra at ground level. While `B.ug` is true there's no neck wall, only a soft wall at x=760. It's always picked as the second attack (so you see it early), then about 35% of the time. To give another boss the attack, add `'burrow'` to its `atk`.
- The **lunge** counts as a hit with knockback. Its invisible "neck wall" only blocks near ground height and pushes gently (6px per frame). There used to be a bug where the wall dragged and pinned Red Eye during the lunge ("I freeze and get stuck"), so **don't bring back a hard wall**.

### Palettes (`js/palettes.js`)

`PALS.<name>` has these fields:

| Field | What it colours |
|---|---|
| `sky` | Gradient, 4 stops |
| `sun` | `'r,g,b'` |
| `sunA` | Sun opacity |
| `hA` | Distant hills |
| `tB`, `tC` | Back and front trees |
| `hC` | Near hills |
| `can` | Canopy |
| `vine` | Vines |
| `lip` | Grass edge, 3 shades |
| `dirt` | Ground |
| `log` | Logs |
| `mist` | Haze |

Flags:
- `dark`: dark level, so Red Eye gets a glow
- `water` / `lava` / `clouds`: what's in the pits
- `wcol`: pit liquid colours `[top, bottom, shine]`

Make variants with `Object.assign({}, BASE, {...})`, the way `PALS.sunset`, `PALS.toxic` and the others are built.

---

## 5. Red Eye: moves and numbers

**Starting stats.** 6 hearts and 5 throwing stars; each pouch gives +3 stars.

**Sword (the Thunder Blade).** Does 2 damage to snakes and has extra reach.

**Super meter** (`p.sp`, 0–100):
- It fills from hits and kills (`gain()`) and doesn't fill while clones are out.
- When it's full, he can use one of two super moves:

| Super move | Key / button | What it does |
|---|---|---|
| Thunder Strike | C or L / **Super** | Lightning hits every enemy on screen: 8 damage to snakes, 10 to a boss |
| Shadow Clones | V / **Clones** | Two shadow Red Eyes fight for 8 seconds (`cloneT=480`) |

**Sneaking.** Crouching in tall grass hides him, and a sleeping snake dies in one hit (a sneak attack).

**Getting hurt.** `hurt(src)` takes `src.dmg || 1` hearts and knocks him back. Falling in a pit costs a heart and returns him to the last safe spot.

**Keyboard**

| Action | Keys |
|---|---|
| Run | ← / → or A / D |
| Jump | Space, ↑ or W |
| Sneak | ↓ or S |
| Sword | Z or J |
| Star | X or K |
| Thunder | C or L |
| Clones | V |

**Touch** (redesigned November 2026 because the iPad was much harder than the keyboard; the measurements are in the `touch-controls` pull request)
- **Each pad is one touch area** (`PADS`, `leftKeys`, `rightKeys` and `syncThumbs` in `js/main.js`). There are no dead spots: a thumb anywhere in a pad works a button. Sliding onto another button takes over without lifting the thumb.
- **Left pad, like a d-pad:** Left and Right on top, Sneak below. Which side of the pad the thumb is on picks Left or Right, with a narrow "don't run" strip in the middle. Pulling the thumb down to the Sneak row adds Sneak. So sliding along the arrows never sneaks, and one thumb can **sneak-walk** (down and to one side).
- **Right pad:** Clones, Super, Star, Sword and Jump (the biggest). The nearest button wins. **Between Sword and Jump does both**, an air attack with one thumb.
- **Touch is a little more forgiving** (`touchAssist`, set by the last input): Red Eye can still jump 10 frames after running off an edge (keyboard: 7), and an early Jump is remembered for 12 frames before landing (keyboard: 8). The level model uses the keyboard numbers.
- The buttons sit 24px above the bottom edge (the iPad's swipe-home strip), are see-through so snakes behind them stay visible, and only show while playing.
- Icon sizes use `calc(var(--s)*.44)`, not percentages, which made them tiny on iPad.

**Game controller** (Bluetooth Xbox or PlayStation pads on the iPad, through the Gamepad API; `pollPad()` in `js/main.js`, read once per frame)

| Action | Xbox | PlayStation |
|---|---|---|
| Run, sneak | Left stick or d-pad (down = sneak) | same |
| Jump | A (or d-pad up) | Cross |
| Sword | X | Square |
| Star | B | Circle |
| Thunder Strike | Y | Triangle |
| Shadow Clones | LB or RB | L1 or R1 |
| Pause; pick on menus | Start (A also picks) | Options (Cross also picks) |

Using a controller hides the touch buttons; touching the screen brings them back. `tests/ui.spec.mjs` tests the controller with a pretend one.

If you change hearts, update `newPlayer()`, `retry()` and the "of 6" text in `champ()`.

---

## 6. Current design decisions (the canon right now)

- **23 levels**, each with its own world and giant cobra boss. They get harder as you go: tougher bosses, faster and more numerous snakes, wider gaps that always have something to land on.
- **Level 10: Master Fang riding his giant spiked cobra.** It's a boss battle, not the final boss, and there's no sword duel and no throwing stars for Master Fang. He was made easier once already.
- **Level 23: the Spike King** is the final boss. He has spikes and shoots spikes.
- **Levels 4 and 5: Ember and Shadow go underground** and burst up under Red Eye.
- **Snakes are normal size** (`GS=1`). Giant snakes were tried and reverted.
- **Cartoon art.** "Realistic" art was tried and fully reverted.
- **No evil ninjas, no ice snakes or ice balls.** Removed by request; the code is dormant.
- **6 hearts.**
- Title pill: "23 levels, Master Fang and the Spike King". If the level count or the villains change, update it, the champion text and the level-select chips.

---

## 7. Gotchas

- **Adding a level** means:
  - a `genLevel` line with a new seed (or a hand-made level)
  - a palette if it's a new world
  - a boss appended to `BOSSES`
  - the level added to `LEVELS`
  - a level-select chip in `index.html` (`data-i` is the 0-based index)
  - the title pill text updated
  - `./dev npm test` (the level model checks the new level can be finished and everything in it reached)

  `unlocked()` and save restore read `LEVELS.length` and `BOSSES.length`, so they adjust on their own.
- **`[hidden]{display:none!important}` must stay** in the CSS. All menu screens rely on it.
- **Sounds need a tap first.** Audio only starts after a tap or click (`initAudio()` on Play); that's an iPad rule.
- **iPad performance.** Avoid creating lots of gradients or shadows per object per frame. The "realistic" art dropped to about 30 fps at Retina resolution. The fixed timestep keeps the game speed right, but it looks choppy.
- **Fonts** are stored in `fonts/` (Lilita One and Nunito 700/800, Latin letters, SIL Open Font License), so the game never contacts another website.
- **Security rules (Content-Security-Policy in `index.html`).** The page may only load its own files and can't run inline code: no `<script>` without `src`, no `onclick="…"` or `style="…"` attributes in the HTML, no `<style>` tags. Setting `element.style.x` from JS is fine. Anything from another website (a font, script or image) would need the policy changed, so copy the file into the repo instead.
- **`<svg>` elements have no `.hidden` property.** Use `el.toggleAttribute('hidden', on)`. (The mute icon never changed because of this.)
- **Boss pop-up text** indexes with `((hp%3)+3)%3`, because health can go negative from multi-damage hits.
- **Level-select chips** always call `startLevel(i)`. A leftover special case once made chip 7 start the Master Fang duel.
- **Sleeping snakes** must still die in one hit from `hitEnemy` (the sneak attack). Keep that when changing damage rules.

---

## 8. History

- **November 2026:** started as a claude.ai artifact (38 versions) through an interview with the designer.
- **November 27, 2026:** moved to this repo. The game was split from one 113 KB HTML file into `css/` and `js/`, with no behaviour changes. Added the smoke test, the app icon and manifest, and GitHub Pages.
- **November 27, 2026 (later):** security review and QA pass.
  - Tooling: dev container, ESLint and Prettier, CI that deploys only when the tests pass, Dependabot.
  - Security: fonts copied into the repo, a Content-Security-Policy, the test hook made local-only.
  - Tests: the level model and the bot playthrough.
  - Fixed: Game Over during a boss's defeat animation, the mute icon never changing, touch buttons staying "held" after switching apps.
