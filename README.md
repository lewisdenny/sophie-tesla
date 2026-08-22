# Tesla Soundboard

A small mobile-first soundboard inspired by Tesla's Toybox emissions testing mode.
It uses original generated audio and has no runtime dependencies, external media, analytics, or build step.

The live site is available at <https://lewisdenny.github.io/sophie-tesla/>.

## Local preview

Run a static server from the repository root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Regenerate assets

The committed WAV files and favicon are deterministic outputs from the asset generator:

```sh
node scripts/generate-assets.mjs
```
