import test from 'node:test';
import assert from 'node:assert/strict';
import { contrast, accentFor, PALETTES } from '../src/core/theme/color.js';

test('contrast of black on white is 21', () => {
  assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
});

test('every palette accent reads on both pure white and pure black', () => {
  for (const { hue } of Object.values(PALETTES)) {
    const accent = accentFor(hue);
    assert.ok(contrast(accent, '#ffffff') >= 4.4, `${hue} on white`);
    assert.ok(contrast(accent, '#000000') >= 4.4, `${hue} on black`);
  }
});

test('mint is the first and default palette', () => {
  assert.equal(Object.keys(PALETTES)[0], 'mint');
});
