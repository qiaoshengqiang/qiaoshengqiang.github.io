# Verification

`smoke.js` is a small headful-Chrome smoke test for the delivered build. It
opens `index.html` through `file://`, so it exercises the same no-server path as
a player double-clicking the file.

It checks:

- loading fade-out, menu/fatal visibility, and empty best-lap state;
- countdown and HUD transition;
- keyboard acceleration, race clock, desktop touch-control hiding;
- pause clock freeze and resume;
- `R` vehicle recovery;
- page errors, console errors, and failed network requests.

## Run

From the project root:

```bash
npm install puppeteer-core
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  node verification/smoke.js
```

On Linux/CI use the installed Chromium path for `CHROME_PATH`. The test must run
headful; headless SwiftShader can render a black canvas and is not considered a
valid visual test for this project.

The broader viewport, touch, audio, result-layout and injected-finish checks are
described in `../ENGINEERING.md`; those were executed with a debug copy outside
the delivered workspace so that the shipped game contains no debug hooks.
