import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SAMPLE = path.join(import.meta.dirname, 'fixtures', 'sample.png');

const group = (page, name) => page.getByRole('radiogroup', { name });
const choose = (page, groupName, label) =>
  group(page, groupName)
    .locator('label')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .click();
const checked = (page, groupName) => group(page, groupName).getByRole('radio', { checked: true });

const openViewer = async (page) => {
  await page.goto('/');
  await page.locator('#file').setInputFiles(SAMPLE);
  await expect(page).toHaveURL(/\/viewer/);
  await expect(page.locator('#art')).toHaveAttribute('src', /^data:image\/png/);
};

const fitsScreen = (page) =>
  page.evaluate(() => {
    const d = document.scrollingElement;
    return d.scrollHeight <= d.clientHeight && d.scrollWidth <= d.clientWidth;
  });

test('input page rejects a file that is not an image', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  await expect(page.locator('#note')).toContainText('not an image');
  await expect(page).not.toHaveURL(/viewer/);
});

test('keyboard alone reaches the file picker, shows focus, and opens it', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab'); // Settings link
  await page.keyboard.press('Tab');
  await expect(page.locator('#file')).toBeFocused();
  await expect(page.locator('.drop__card')).toHaveCSS('outline-style', 'solid');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Enter')]);
  expect(chooser.isMultiple()).toBe(false);
});

test('viewer without an image sends you back to the input page', async ({ page }) => {
  await page.goto('/viewer');
  await expect(page).not.toHaveURL(/viewer/);
});

test('no page scrolls, including the viewer with all controls', async ({ page }) => {
  await page.goto('/');
  expect(await fitsScreen(page)).toBe(true);
  await page.goto('/settings');
  expect(await fitsScreen(page)).toBe(true);
  await openViewer(page);
  expect(await fitsScreen(page)).toBe(true);
});

test('viewer starts at 8-bit and switches level', async ({ page }) => {
  await openViewer(page);
  await expect(checked(page, 'Bit level')).toHaveAccessibleName('8-bit');
  const before = await page.locator('#art').getAttribute('src');
  await choose(page, 'Bit level', '10-bit');
  await expect(page.locator('#tag')).toHaveText('10-bit');
  expect(await page.locator('#art').getAttribute('src')).not.toBe(before);
});

test('the viewer shows the small pixel grid; zoom and export use the large render', async ({ page }) => {
  await openViewer(page);
  const naturalWidth = (locator) => locator.evaluate((img) => img.naturalWidth);
  expect(await naturalWidth(page.locator('#art'))).toBeLessThanOrEqual(64);

  await page.locator('#zoom').click();
  const modalImage = page.getByRole('dialog').locator('.modal__img');
  await expect.poll(() => naturalWidth(modalImage)).toBeGreaterThanOrEqual(1024);
  await page.keyboard.press('Escape');

  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export').click()]);
  const png = await readFile(await download.path());
  expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(1024); // IHDR width
});

test('original and compare views', async ({ page }) => {
  await openViewer(page);
  await choose(page, 'View', 'Original');
  await expect(page.locator('#art')).toBeHidden();
  await choose(page, 'View', 'Compare');
  await expect(page.locator('#compare')).toBeVisible();

  const box = await page.locator('#stage').boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('#compare')).toHaveAttribute('aria-valuenow', '25');

  await page.locator('#compare').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#compare')).toHaveAttribute('aria-valuenow', '30');
});

test('keyboard focus on the compare slider is visibly drawn', async ({ page }) => {
  await openViewer(page);
  await choose(page, 'View', 'Compare');
  await expect(page.locator('#stage')).toHaveClass(/is-sweeping/);
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
  const compare = page.locator('#compare');
  for (let i = 0; i < 10 && !(await compare.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Shift+Tab');
  }
  await expect(compare).toBeFocused();
  const grip = await page.locator('.compare__grip').boundingBox();
  const clip = { x: grip.x - 16, y: grip.y - 16, width: grip.width + 32, height: grip.height + 32 };
  const focused = await page.screenshot({ clip });
  await compare.blur();
  expect(focused.equals(await page.screenshot({ clip }))).toBe(false);
});

test('zoom modal opens, zooms, and closes three ways', async ({ page }) => {
  await openViewer(page);
  const dialog = page.getByRole('dialog');
  await page.locator('#zoom').click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Zoom in' }).click();
  await expect(dialog.locator('.modal__level')).toHaveText('150%');
  await dialog.getByRole('button', { name: 'Back' }).click();
  await expect(dialog).toBeHidden();

  await page.locator('#zoom').click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.locator('#zoom').click();
  await dialog.locator('.modal__stage').click({ position: { x: 4, y: 4 } });
  await expect(dialog).toBeHidden();
});

test('export downloads a png named for the level', async ({ page }) => {
  await openViewer(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export').click()]);
  expect(download.suggestedFilename()).toBe('pixel-art-8bit.png');
});

test('default level from settings applies to the next image', async ({ page }) => {
  await page.goto('/settings');
  await choose(page, 'Default bit level', '12-bit');
  await openViewer(page);
  await expect(checked(page, 'Bit level')).toHaveAccessibleName('12-bit');
});

test('theme change shows on the page you go back to, without a refresh', async ({ page }) => {
  await openViewer(page);
  const root = page.locator('html');
  const accent = () => root.evaluate((el) => getComputedStyle(el).getPropertyValue('--accent'));
  const mint = await accent();
  await page.getByRole('link', { name: 'Settings' }).click();
  await choose(page, 'Theme color', 'Rose');
  await choose(page, 'Appearance', 'Dark');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/viewer/);
  await expect(root).toHaveAttribute('data-mode', 'dark');
  expect(await accent()).not.toBe(mint);
});

const themeNow = (page) =>
  page.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent'),
  }));

const paletteColor = (page, name) =>
  page.evaluate((palette) => {
    const probe = Object.assign(document.createElement('i'), { hidden: true });
    probe.dataset.palette = palette;
    document.body.append(probe);
    const color = getComputedStyle(probe).getPropertyValue('--palette');
    probe.remove();
    return color;
  }, name);

test('a stored theme is already applied before the page scripts run (no flash)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('art8:prefs', JSON.stringify({ palette: 'rose', mode: 'dark' })));
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/input-page.js', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  await page.locator('.drop').waitFor({ state: 'attached' });
  const painted = await themeNow(page);
  const rose = await paletteColor(page, 'rose');
  release();
  expect(painted.background).toBe('rgb(0, 0, 0)');
  expect(painted.accent).toBe(rose);
});

test('with no stored choice the theme follows the system setting, live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect((await themeNow(page)).background).toBe('rgb(0, 0, 0)');
  await page.emulateMedia({ colorScheme: 'light' });
  expect((await themeNow(page)).background).toBe('rgb(255, 255, 255)');
});

test('zoomed modal image can be panned by dragging', async ({ page }) => {
  await openViewer(page);
  await page.locator('#zoom').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Zoom in' }).click();
  await dialog.getByRole('button', { name: 'Zoom in' }).click();
  const img = await dialog.locator('.modal__img').boundingBox();
  const [cx, cy] = [img.x + img.width / 2, img.y + img.height / 2];
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 60, cy + 20, { steps: 4 });
  await page.mouse.up();
  expect(await dialog.evaluate((el) => el.style.getPropertyValue('--x'))).toBe('60');
});

test('dithering is off by default and the toggle changes the image', async ({ page }) => {
  await openViewer(page);
  const dither = page.locator('#dither');
  await expect(dither).toHaveAttribute('aria-pressed', 'false');
  const plain = await page.locator('#art').getAttribute('src');
  await dither.click();
  await expect(dither).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('#art').getAttribute('src')).not.toBe(plain);
});
test('a choice group is one tab stop and arrow keys move the choice', async ({ page }) => {
  await openViewer(page);
  const levels = group(page, 'Bit level');
  await levels.getByRole('radio', { checked: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(checked(page, 'Bit level')).toHaveAccessibleName('10-bit');
  await expect(page.locator('#tag')).toHaveText('10-bit');
  const stops = await levels
    .getByRole('radio')
    .evaluateAll((radios) => radios.filter((radio) => radio.tabIndex >= 0 && radio.checked).length);
  expect(stops).toBe(1);
  await page.keyboard.press('Tab');
  expect(await levels.evaluate((el) => el.contains(document.activeElement))).toBe(false);
});

test('theme swatches are a radio group too', async ({ page }) => {
  await page.goto('/settings');
  await expect(checked(page, 'Theme color')).toHaveAccessibleName('Mint');
  await choose(page, 'Theme color', 'Sky');
  await expect(checked(page, 'Theme color')).toHaveAccessibleName('Sky');
});

test('corrupt stored preferences fall back to defaults instead of breaking the viewer', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('art8:prefs', JSON.stringify({ palette: 'nope', mode: 7, level: 'abc', dither: 'yes' })),
  );
  await openViewer(page);
  await expect(checked(page, 'Bit level')).toHaveAccessibleName('8-bit');
  await expect(page.locator('#note')).toHaveText('');
});

test('the zoom modal keeps keyboard focus inside and returns it on close', async ({ page }) => {
  await openViewer(page);
  await page.locator('#zoom').click();
  const dialog = page.getByRole('dialog');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    // Focus may wrap out to the browser's own UI (body), but never lands on the inert page behind the dialog.
    expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#zoom')).toBeFocused();
});

test('settings Back goes home when there is no earlier page', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).not.toHaveURL(/settings/);
});

test('in a short landscape viewport every control can be scrolled to', async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await openViewer(page);
  const exportButton = page.getByRole('button', { name: 'Export PNG' });
  await exportButton.scrollIntoViewIfNeeded();
  await expect(exportButton).toBeInViewport();
});

test('an image that cannot be stored is reported as a storage problem, not a bad file', async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new Error('blocked');
    };
  });
  await page.goto('/');
  await page.locator('#file').setInputFiles(SAMPLE);
  await expect(page.locator('#note')).toContainText('would not keep the image');
  await expect(page).not.toHaveURL(/viewer/);
});
