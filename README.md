# Reeldemo landing site

Static marketing site for [reeldemo.io](https://reeldemo.io), published via GitHub Pages from [reeldemo/reeldemo.github.io](https://github.com/reeldemo/reeldemo.github.io).

This repo is **standalone** — it does not live alongside app code in a parent monorepo folder.

## Contents

| Path | Purpose |
|------|---------|
| `/` | Org landing page |
| `/studio/` | Reeldemo Studio product page |
| `/reelsynth/` | ReelSynth product page (links to [reelsynth](https://github.com/reeldemo/reelsynth) app repo) |
| `/kaleidoscope/` | Kaleidoscope promo + live demo |
| `/blog/` | Product blog |
| `/docs/` | Site ops and marketing docs (not app developer docs) |

## Related repos

| Repo | Role |
|------|------|
| [reeldemo/reelsynth](https://github.com/reeldemo/reelsynth) | Wavetable synth app (Rust) — developer docs live there |
| [reeldemo/reeldemo-ableton](https://github.com/reeldemo/reeldemo-ableton) | Reeldemo Studio / Ableton integration |
| [reeldemo/reeldemo-kaleidoscope](https://github.com/reeldemo/reeldemo-kaleidoscope) | Kaleidoscope ASCII engine |

## Local workspace

Canonical clone path on this machine:

```
C:\Users\Julian\Documents\Programming\reeldemo.io
```

Do not maintain a second clone under `github/reeldemo/reeldemo.github.io`.

## Deploy

Push to `main` on GitHub; Pages serves the repo root. Custom domain config: [docs/CUSTOM_DOMAIN.md](docs/CUSTOM_DOMAIN.md).
