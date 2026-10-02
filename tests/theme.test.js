import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PALETTES } from '../src/core/theme/palettes.js';
import { DEFAULT_PREFS } from '../src/core/storage/prefs.js';

const css = readFileSync(new URL('../src/core/theme/theme.css', import.meta.url), 'utf8');

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const accents = Object.fromEntries(
  [...css.matchAll(/\[data-palette="(\w+)"\]\s*\{\s*--palette:\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]),
);

test('contrast of black on white is 21', () => {
  assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
});

test('theme.css defines exactly the palettes the settings page offers', () => {
  assert.deepEqual(Object.keys(accents).sort(), Object.keys(PALETTES).sort());
});

test('every palette accent reads on both pure white and pure black', () => {
  for (const [name, hex] of Object.entries(accents)) {
    assert.ok(contrast(hex, '#ffffff') >= 4.4, `${name} on white`);
    assert.ok(contrast(hex, '#000000') >= 4.4, `${name} on black`);
  }
});

test('the default palette is the one theme.css uses when no palette is chosen', () => {
  assert.match(css, new RegExp(`:root, \\[data-palette="${DEFAULT_PREFS.palette}"\\]\\s*\\{`));
});
