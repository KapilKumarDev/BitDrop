import { test, expect } from '@playwright/test';
import path from 'node:path';

const SAMPLE = path.join(import.meta.dirname, 'fixtures', 'sample.png');

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
  await expect(page.locator('#levels [aria-checked="true"]')).toHaveText('8-bit');
  const before = await page.locator('#art').getAttribute('src');
  await page.locator('#levels .seg', { hasText: /^10-bit$/ }).click();
  await expect(page.locator('#art-tag')).toHaveText('10-bit');
  expect(await page.locator('#art').getAttribute('src')).not.toBe(before);
});

test('original and compare views', async ({ page }) => {
  await openViewer(page);
  await page.locator('#view .seg', { hasText: 'Original' }).click();
  await expect(page.locator('#art')).toBeHidden();
  await page.locator('#view .seg', { hasText: 'Compare' }).click();
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
  await page.locator('#level .seg', { hasText: /^12-bit$/ }).click();
  await openViewer(page);
  await expect(page.locator('#levels [aria-checked="true"]')).toHaveText('12-bit');
});

test('theme change shows on the page you go back to, without a refresh', async ({ page }) => {
  await openViewer(page);
  const root = page.locator('html');
  const mint = await root.evaluate((el) => el.style.getPropertyValue('--accent'));
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Rose' }).click();
  await page.locator('#mode .seg', { hasText: 'Dark' }).click();
  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/viewer/);
  await expect(root).toHaveAttribute('data-mode', 'dark');
  expect(await root.evaluate((el) => el.style.getPropertyValue('--accent'))).not.toBe(mint);
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