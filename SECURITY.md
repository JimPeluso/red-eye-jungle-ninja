# Security

Red Eye: Jungle Ninja is a static browser game. It has no server, no accounts, and it doesn't collect or send any data. It only loads its own files, and a Content-Security-Policy in `index.html` enforces that. Progress (unlocked levels, sound on/off) is saved only in the player's own browser.

## Reporting a problem

If you find a security problem, please report it privately: on this repository's **Security** tab, choose **Report a vulnerability**. Please don't open a public issue for it.

## What's in place

- A Content-Security-Policy: the page can't load scripts, styles or fonts from anywhere else, and can't run inline code.
- No third-party code. The fonts are stored in the repo (`fonts/`).
- The test hook (`?test`) only exists when the game runs from a local file or `localhost`, never on the live site.
- GitHub secret scanning with push protection, Dependabot alerts and security updates, and a rule on `main` that blocks force-pushes and deletion and requires the tests to pass.
- The site deploys from GitHub Actions only after the tests pass, and only the game's own files are published.
- GitHub Actions are pinned to exact commits, and only GitHub's own actions (plus Dependabot's metadata action) may run.
