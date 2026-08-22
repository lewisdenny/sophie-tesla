# Tesla Soundboard

A small mobile-first soundboard for Tesla's Toybox emissions testing sounds.
It has no runtime dependencies, external media, analytics, or build step.

The live site is available at <https://lewisdenny.github.io/sophie-tesla/>.

## Local preview

Run a static server from the repository root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Audio source

The six WAV clips come from [`niccolodevries/tesla-sounds`](https://github.com/niccolodevries/tesla-sounds/tree/6469d5ad54096b3fae2f17220906beb790928f51), pinned at commit `6469d5ad54096b3fae2f17220906beb790928f51`.
That repository identifies the files as assets extracted from Tesla firmware and does not declare a licence.
Review the applicable permissions before redistributing them.
