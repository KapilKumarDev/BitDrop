# 8-bit Art Maker

Turns a picture into 8-, 16- or 32-bit pixel art. Static site; the only dependencies are dev tools for serving and browser tests.

- Run: `npm start` (any static server works; ES modules need http, not file://)
- Logic tests: `npm test` (Node's built-in runner, `tests/*.test.js`)
- Browser tests: `npm install`, then once `npx playwright install chromium`, then `npm run test:e2e` (`tests/e2e/`, mobile viewport, starts its own server on port 3000 or reuses one already running)

## Structure (by feature)
- `src/core/` shared: `theme/` (tokens, tone/tint/shade), `storage/`, `ui/`, `layout/`
- `src/features/convert|input|viewer|zoom-modal|settings|export/` one folder per feature
- Features import only from `core/` (plus `convert` for bit levels); pages never import each other.

## Bit levels
4, 6, 8, 10, 12, 16, 24 and 32. Color depth is the real RGB split (8-bit = 3-3-2, 10-bit = 3-4-3, 16-bit = 5-6-5, 24-bit = 8-8-8) and the pixel grid grows with the level (64 px at 8-bit, 256 px at 32-bit). Dithering is optional (off by default, toggle on the viewer) and skips flat areas.

## Theme
Only `--bg`/`--fg` change between light and dark. The accent is chosen at equal contrast against white and black.