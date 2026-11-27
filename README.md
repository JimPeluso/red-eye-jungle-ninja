# Red Eye: Jungle Ninja

[![CI](https://github.com/JimPeluso/red-eye-jungle-ninja/actions/workflows/ci.yml/badge.svg)](https://github.com/JimPeluso/red-eye-jungle-ninja/actions/workflows/ci.yml)

**▶ Play: <https://jimpeluso.github.io/red-eye-jungle-ninja/>**

Red Eye is a jungle ninja with a red headband and a Thunder Blade. Run, jump, sneak and fight your way through **23 levels** of snakes. Every level ends with a giant cobra boss. **Master Fang** rides his spiked cobra on Level 10, and the **Spike King** waits on Level 23.

Designed by a young game designer and built together with Claude.

## On an iPad

Open the link in Safari, tap **Share → Add to Home Screen**, and it launches full screen like an app. Play with the iPad turned sideways.

The game remembers where you got to. Next time, tap **Continue** to go back to your last checkpoint with your hearts, coins and stars.

## Controls

| Action | Keyboard | iPad | Game controller |
|---|---|---|---|
| Run | ← → (or A D) | Left / Right buttons | Left stick or d-pad |
| Jump | Space (or ↑ / W) | **Jump** | A / Cross |
| Sword | Z (or J) | **Sword** | X / Square |
| Jump attack | Space + Z | thumb **between Sword and Jump** | A + X |
| Throwing star | X (or K) | **Star** | B / Circle |
| Sneak | ↓ (or S) | **Sneak** (or thumb down-and-sideways to sneak while moving) | Down |
| Thunder Strike (super meter full) | C (or L) | **Super** | Y / Triangle |
| Shadow Clones (super meter full) | V | **Clones** | LB RB / L1 R1 |
| Pause | P or Esc | ⏸ | Start / Options |

On the iPad you can slide your thumb from one button to the next without lifting it. A Bluetooth Xbox or PlayStation controller works too: connect it in the iPad's Bluetooth settings, then press any button in the game.

## The snakes

- **Green snake:** one hit.
- **Sleeping snake:** sneak up for an instant sneak attack.
- **Orange spitter:** stands still and spits venom.
- **Blue cobra:** rears up tall.
- **Flying snake:** swoops down from above.
- **Two-headed snake:** bites both ways.
- **Rock Snake:** looks like a boulder (your sword just goes *clang*). Wait for it to pop out, then strike.
- **Drop Snake:** hangs from a vine and drops on you. Watch for the shaking leaves.
- **Spring Snake:** coils up and hops at you. Run under it or slash it when it lands.
- **Fire Snake:** leaves little flames behind it. Come at it from the front.
- **Shield Snake:** its shield blocks your sword. Jump over it and hit its back.
- **Ghost Snake:** fades in and out. Hit it while it's solid.

When a boss gets mad (half health), it can have its own special move. Watch out for Moss's **Vine Grab**!

## Run it yourself

There's no build step: open `index.html` in a browser.

The tools run in a Docker container, so the only thing you need installed is [Docker](https://www.docker.com/products/docker-desktop/):

```sh
./dev npm run setup   # once: installs the test tools inside Docker
./dev npm test        # every test: a bot plays the whole game, every level is checked
./dev npm run serve   # play at http://localhost:8000
```

Every push to `main` is tested, and the site only updates when the tests pass. How the code is organised, the level and boss formats, and the design rules are all in [CLAUDE.md](CLAUDE.md). To report a security problem, see [SECURITY.md](SECURITY.md).
