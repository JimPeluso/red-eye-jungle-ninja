# Red Eye: Jungle Ninja — project notes for Claude

Red Eye is a ninja with a red headband fighting snakes in a jungle. It's a side-scrolling, Mario-style platformer that runs in the browser. There are 23 levels, and each one ends with a giant cobra boss. Master Fang rides his cobra on Level 10, and the Spike King is the final boss on Level 23.

- **Who's who.** The **game designer is a 10-year-old boy**: the ideas, names and rules are his. His dad (the repo owner) runs the project, builds it with Claude and reviews the code.
- **Where it's played.** Mostly on an **iPad in landscape** with the on-screen touch buttons, sometimes on a laptop with the keyboard.
- **Play link.** <https://jimpeluso.github.io/red-eye-jungle-ninja/> (GitHub Pages, deployed from `main`).
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

**Run it**
- Open `index.html` in a browser, or run `npm run serve` (uses `python3 -m http.server 8000`) and go to <http://localhost:8000>.
- To try it on the iPad before pushing: serve it and open `http://<laptop-ip>:8000` on the same Wi-Fi.

**Test it**
- One-time setup: `npm install && npx playwright install chromium`.
- Then `npm test` runs `tests/smoke.mjs` in headless Chromium at 1024×768 (iPad landscape).

| What the smoke test checks | Details |
|---|---|
| Level data | No pit has more than 220px with nothing to land on. Generated levels also obey the builder rules (section 4). Every gate is on ground, every boss and palette exists. |
| Rock Snake | Clangs while hidden, pops out, can be beaten. |
| Shadow's burrow | Goes underground, chases, bursts up, lies dazed, can be hit while dazed. |
| Levels | Plays a few seconds of all 23. |
| Bosses | Starts every boss a level uses. |
| Level flow | Beating Master Fang leads to Level 11; beating the final boss shows the "You beat the game!" screen. |
| Errors | Fails on any page error. |

- Screenshots go to `tests/shots/` (gitignored). **Look at them after any visual change.** The test only proves nothing crashed, not that it looks right.
- Opening the page with `?test` exposes `window.__t`, a test hook with getters for `p`, `snakes`, `B`, `mode` and `li`, plus `LEVELS`, `BOSSES`, `PALS`, `mkSnake`, `startLevel`, `startBoss`, `respawnAt`, `bossHit` and `unlocked`. Without `?test` it doesn't exist.

**Ship it**
- Push to `main`. GitHub Pages redeploys in about a minute.
- On the iPad, "Add to Home Screen" makes it a full-screen app (via `manifest.webmanifest` and the `icons/` folder).

**Before every push:** `npm test` passes, and you've looked at the screenshots for anything visual.

---

## 3. How the code is put together

Every file in `js/` is a **plain classic `<script>`**, not a module. They all share **one global scope** and are loaded **in order** by `index.html`. Classic scripts were chosen on purpose so the game still works when you double-click `index.html` (ES modules don't load over `file://`).

Rules that follow from that:

- **Top-level code in a file can only use things from files loaded before it.** Functions can call anything when they run.
- **Never declare the same top-level name in two files.** That's a SyntaxError and the whole game goes blank.
- **Adding a file means adding a `<script>` tag** in the right place in `index.html`.

| File | What's in it |
|---|---|
| `js/core.js` | `$`, the canvas `cv`/`ctx`, world constants `WH=580` (world height), `GY=460` (top of the ground), `STEP` (60 fps tick), `ARENA=960` (boss arena width) |
| `js/palettes.js` | `PALS`: the colours of every world |
| `js/levels.js` | Levels 1–10 (hand-made), `genLevel()` and Levels 11–23, `LEVELS`, `arena()` |
| `js/bosses.js` | `BOSSES`: every giant cobra |
| `js/scenery.js` | Coins (Level 1 hand-placed in `CO`, others via `autoCoins`), seeded background scenery, `load(level)` |
| `js/state.js` | Game state variables, helpers (`hit`, `rnd`, `pp`), `mkSnake`, `newPlayer`, `startLevel`, `startBoss`, `go(mode)`, banners, unlocks |
| `js/effects.js` | Particles (`puff`, `dust`, `sparkle`) and pop-up text (`pop`) |
| `js/sound.js` | All sound effects (`sfx.*`), synthesised with Web Audio. There are no sound files. |
| `js/enemies.js` | `ebox` (hit boxes), `moveSnake` (behaviour per kind), `hitEnemy`, `kill`, `gain` (super meter) |
| `js/player.js` | Shadow Clones, Thunder Strike, `hurt`, `fallen`, `over`, `levelClear`, `champ` |
| `js/boss.js` | Giant cobra AI: `pickAttack`, `summon`, `bossHit`, `bossStep` state machine |
| `js/duel.js` | Master Fang sword duel. **Not used** (he said "no duel"); kept switchable. |
| `js/step.js` | `step()`, one game tick: input, physics, collisions, enemies, items, camera |
| `js/draw-world.js` | Drawing helpers (`rr`, `circle`, `ell`), trees, ground, water/lava/clouds, logs, signs, lanterns, gate, coins, items |
| `js/draw-enemies.js` | `snake()` and the special snakes (`drawRock`, `twoHead`, flying wings) |
| `js/draw-ninjas.js` | `fig()` (any ninja), `ninja()` (Red Eye), `fang()`, plus dormant evil-ninja and duel drawing |
| `js/draw-boss.js` | The giant cobra body and head, temple walls and torches |
| `js/render.js` | Lightning bolts, health bars, shock waves, grass, then `world()` and `render()` |
| `js/main.js` | `resize`, `hud`, the main loop, keyboard and touch controls, buttons, save/restore, start-up |

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
- Saves are per web address. The game used to live at a claude.ai artifact link, so unlocks didn't carry over to GitHub Pages.

**Leftovers from the artifact days.** `window.claude?.hot` (snapshot/restore across live reloads) comes from when this was a claude.ai artifact. It does nothing on GitHub Pages and is harmless. The old artifact link is frozen at version 38.

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
| 4, 5, 6 | (were evil ninjas) | | `mkSnake` turns them into kinds 3, 2 and 0. Level 6 still lists them. |

Health 2.2 for the special kinds comes from his rule: "special snakes have 10% more health" than 2 sword hits. Basic snakes take one hit.

**Adding a new snake kind:**
1. In `mkSnake` (state.js), add a flag and its health.
2. Give it a hit box in `ebox` (enemies.js).
3. Add its behaviour in `moveSnake`.
4. Add any special hit rules in `step()` (step.js). The hidden Rock Snake skip is the example to copy.
5. Draw it in `snake()` (draw-enemies.js) and give it a death-puff colour in `kill`.
6. Place it in levels. Optionally add it to the `genLevel` pool, but read the reshuffle warning above first.
7. Add a check to `tests/smoke.mjs`.

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
| 3 | Ember | 4 | 45 |
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
- **Burrow** (only Shadow has it, his idea: "cave snake can go underground"). The sequence:
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

**Touch**
- The left pad has Left, Sneak and Right. It tracks the **nearest** button, so sliding a thumb from Left to Right works without lifting it.
- The right pad has Clones, Super, Star, Sword and Jump (the biggest).
- Icon sizes use `calc(var(--s)*.44)`, not percentages, which made them tiny on iPad.

If you change hearts, update `newPlayer()`, `retry()` and the "of 6" text in `champ()`.

---

## 6. Current design decisions (the canon right now)

- **23 levels**, each with its own world and giant cobra boss. They get harder as you go: tougher bosses, faster and more numerous snakes, wider gaps that always have something to land on.
- **Level 10: Master Fang riding his giant spiked cobra.** It's a boss battle, not the final boss, and there's no sword duel and no throwing stars for Master Fang. He was made easier once already.
- **Level 23: the Spike King** is the final boss. He has spikes and shoots spikes.
- **Level 5: Shadow, the giant cave cobra, goes underground** and bursts up under Red Eye.
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
  - `npm test`

  `unlocked()` and save restore read `LEVELS.length` and `BOSSES.length`, so they adjust on their own.
- **`[hidden]{display:none!important}` must stay** in the CSS. All menu screens rely on it.
- **Sounds need a tap first.** Audio only starts after a tap or click (`initAudio()` on Play); that's an iPad rule.
- **iPad performance.** Avoid creating lots of gradients or shadows per object per frame. The "realistic" art dropped to about 30 fps at Retina resolution. The fixed timestep keeps the game speed right, but it looks choppy.
- **Fonts** come from Google Fonts. Without a connection it falls back to system fonts, which is fine.
- **Boss pop-up text** indexes with `((hp%3)+3)%3`, because health can go negative from multi-damage hits.
- **Level-select chips** always call `startLevel(i)`. A leftover special case once made chip 7 start the Master Fang duel.
- **Sleeping snakes** must still die in one hit from `hitEnemy` (the sneak attack). Keep that when changing damage rules.

---

## 8. History

- **November 2026:** started as a claude.ai artifact (38 versions) through an interview with the designer.
- **November 27, 2026:** moved to this repo. The game was split from one 113 KB HTML file into `css/` and `js/`, with no behaviour changes. Added the smoke test, the app icon and manifest, and GitHub Pages.
