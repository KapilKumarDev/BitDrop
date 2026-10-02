# 8-bit Art Maker

Turns a picture into pixel art at 4 to 32 bit levels. Static site; the only dependencies are dev tools for serving and browser tests (Node 20.11 or later).

- Run: `npm start` (any static server works; ES modules need http, not file://)
- Logic tests: `npm test` (Node's built-in runner, `tests/*.test.js`)
- Browser tests: `npm install`, then once `npx playwright install chromium`, then `npm run test:e2e` (`tests/e2e/`, mobile viewport, starts its own server on port 3000 or reuses one already running). Controls are found by role and accessible name, the way a keyboard or screen-reader user finds them.

## Pages
`index.html` (pick an image), `viewer.html` (convert, compare, zoom, export), `settings.html` (theme, appearance, default level). The picked image travels to the viewer as a lossless PNG Blob in IndexedDB.

## Structure (by feature)
- `src/core/` shared code: `theme/` (tokens, palettes, theme.js), `levels/` (bit levels), `storage/` (prefs, image handoff), `canvas/` (canvas helpers, PNG download), `ui/` (button, segmented radio group, `ids()`), `layout/` (page shell)
- `src/features/` one folder per feature: `convert`, `compare`, `zoom-modal`, `input`, `viewer`, `settings`
- Features import from `core/` only. The exceptions are the page scripts that compose features: `viewer-page.js` uses `convert`, `compare` and `zoom-modal`.

## Bit levels
4, 6, 8, 10, 12, 16, 24 and 32 (`src/core/levels/levels.js`). Color depth is the real RGB split (8-bit = 3-3-2, 10-bit = 3-4-3, 16-bit = 5-6-5, 24-bit = 8-8-8) and the pixel grid grows with the level (64 px at 8-bit, 256 px at 32-bit). Dithering is optional (off by default, toggle on the viewer) and skips flat areas.

## Theme
Only `--bg`/`--fg` change between light and dark, through `light-dark()`; with no stored choice the system setting decides, in pure CSS. Each accent is a fixed value in `theme.css` that keeps equal contrast against white and black (checked by `tests/theme.test.js`). `src/core/theme/theme.js` is a classic script in every page's `<head>`: it blocks the first paint so the stored choice is applied before anything is drawn. Stored preferences are validated on load; a bad value falls back to its default.

## Accessibility
Choice groups are native radio inputs (arrow keys, one tab stop). The zoom modal is a native `<dialog>` (inert background, focus kept inside, Escape to close). Pages do not scroll, except in short landscape viewports.
