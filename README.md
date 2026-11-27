# Red Eye: Jungle Ninja

**▶ Play: <https://jimpeluso.github.io/red-eye-jungle-ninja/>**

Red Eye is a jungle ninja with a red headband and a Thunder Blade. Run, jump, sneak and fight your way through **23 levels** of snakes. Every level ends with a giant cobra boss. **Master Fang** rides his spiked cobra on Level 10, and the **Spike King** waits on Level 23.

Designed by a 10-year-old and built by his dad with Claude.

## On an iPad

Open the link in Safari, tap **Share → Add to Home Screen**, and it launches full screen like an app. Play with the iPad turned sideways.

## Controls

| Action | Keyboard | iPad |
|---|---|---|
| Run | ← → (or A D) | Left / Right buttons |
| Jump | Space (or ↑ / W) | **Jump** |
| Sword | Z (or J) | **Sword** |
| Throwing star | X (or K) | **Star** |
| Sneak | ↓ (or S) | **Sneak** |
| Thunder Strike (super meter full) | C (or L) | **Super** |
| Shadow Clones (super meter full) | V | **Clones** |

## The snakes

- **Green snake:** one hit.
- **Sleeping snake:** sneak up for an instant sneak attack.
- **Orange spitter:** stands still and spits venom.
- **Blue cobra:** rears up tall.
- **Flying snake:** swoops down from above.
- **Two-headed snake:** bites both ways.
- **Rock Snake:** looks like a boulder (your sword just goes *clang*). Wait for it to pop out, then strike.

## Run it yourself

There's no build step. Open `index.html` in a browser, or:

```sh
npm run serve        # http://localhost:8000
npm install && npx playwright install chromium   # once, for tests
npm test             # plays every level and boss in a headless browser
```

How the code is organised, the level and boss formats, and the design rules are all in [CLAUDE.md](CLAUDE.md).
