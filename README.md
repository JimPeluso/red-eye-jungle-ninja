# Red Eye: Jungle Ninja

[![CI](https://github.com/JimPeluso/red-eye-jungle-ninja/actions/workflows/ci.yml/badge.svg)](https://github.com/JimPeluso/red-eye-jungle-ninja/actions/workflows/ci.yml)

**▶ Play: <https://jimpeluso.github.io/red-eye-jungle-ninja/>**

Red Eye is a jungle ninja with a red headband and a Thunder Blade. Run, jump, sneak and fight your way through **23 levels** of snakes. Every level ends with a giant cobra boss. **Master Fang** rides his spiked cobra on Level 10, and the **Spike King** waits on Level 23.

Designed by a young game designer and built together with Claude.

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

There's no build step: open `index.html` in a browser.

The tools run in a Docker container, so the only thing you need installed is [Docker](https://www.docker.com/products/docker-desktop/):

```sh
./dev npm run setup   # once: installs the test tools inside Docker
./dev npm test        # every test: a bot plays the whole game, every level is checked
./dev npm run serve   # play at http://localhost:8000
```

Every push to `main` is tested, and the site only updates when the tests pass. How the code is organised, the level and boss formats, and the design rules are all in [CLAUDE.md](CLAUDE.md). To report a security problem, see [SECURITY.md](SECURITY.md).
