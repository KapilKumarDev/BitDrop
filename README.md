# 8-bit Art Maker

Turns a picture into pixel art at 4 to 32 bit levels. Static site; the only dependencies are dev tools for serving and browser tests (Node 26.10 or later, as in `package.json`).

- Deploy: static, no build step. Cloudflare Workers Builds redeploys on every git push and serves the `public/` folder through the `assets` setting in `wrangler.jsonc`; the Node version it builds with comes from `.node-version`.
- Run: `npm start` (serves on port 3000; any static server works, ES modules need http, not file://)
- Lint and format: `npm run check` only reports problems; `npm run fix` applies the fixes Biome can make safely (formatting, import order, safe lint fixes) and leaves the rest to report.
- Logic tests: `npm test` (Node's built-in runner, `tests/*.test.js`)
- Browser tests: `npm install`, then once `npx playwright install chromium`, then `npm run test:e2e` (`tests/e2e/`, mobile viewport, starts `npm start` itself or reuses a server already on port 3000). `npm run test:browsers` runs the same tests in Firefox and WebKit and first installs those two browsers itself (a no-op once they are there); without them every test fails at launch. Controls are found by role and accessible name, the way a keyboard or screen-reader user finds them.

## Try it
[BitDrop](https://bitdrop.kapilk.workers.dev/)

## Pages

`index.html` (pick an image), `viewer.html` (convert, compare, zoom, export), `settings.html` (theme, appearance, default level). The picked image travels to the viewer as lossless PNG bytes in IndexedDB (bytes rather than a Blob, which WebKit cannot store in private sessions).

## Structure (by feature)

- `public/src/core/` shared code: `theme/` (tokens, palettes, theme.js), `levels/` (bit levels), `storage/` (prefs, image handoff), `canvas/` (canvas helpers, PNG download), `ui/` (button, segmented radio group, `ids()`), `layout/` (page shell)
- `public/src/features/` one folder per feature: `convert`, `compare`, `zoom-modal`, `input`, `viewer`, `settings`
- Features import from `core/` only. The exceptions are the page scripts that compose features: `viewer-page.js` uses `convert`, `compare` and `zoom-modal`.

## Bit levels

4, 6, 8, 10, 12, 16, 24 and 32 (`public/src/core/levels/levels.js`). Color depth is the real RGB split (8-bit = 3-3-2, 10-bit = 3-4-3, 16-bit = 5-6-5, 24-bit = 8-8-8) and the pixel grid grows with the level (64 px at 8-bit, 256 px at 32-bit). Dithering is optional (off by default, toggle on the viewer) and skips flat areas.

## Theme

Only `--bg`/`--fg` change between light and dark, through `light-dark()`; with no stored choice the system setting decides, in pure CSS. Each accent is a fixed value in `theme.css` that keeps equal contrast against white and black (checked by `tests/theme.test.js`). `public/src/core/theme/theme.js` is a classic script in every page's `<head>`: it blocks the first paint so the stored choice is applied before anything is drawn. Stored preferences are validated on load; a bad value falls back to its default.

## Accessibility

Choice groups are native radio inputs (arrow keys, one tab stop). The zoom modal is a native `<dialog>` (inert background, focus kept inside, Escape to close). Pages do not scroll, except in short landscape viewports.