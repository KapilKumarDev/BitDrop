import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVEL_OPTIONS } from '../src/core/levels/levels.js';
import { DEFAULT_PREFS, loadPrefs } from '../src/core/storage/prefs.js';

const store = (raw) => Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => raw }, configurable: true });

test('unreadable or missing stored prefs give the defaults', () => {
  for (const raw of [null, 'not json', '5', '[]']) {
    store(raw);
    assert.deepEqual(loadPrefs(), DEFAULT_PREFS);
  }
});

test('each invalid stored value falls back on its own and valid ones are kept', () => {
  store(JSON.stringify({ palette: 'nope', mode: 5, level: 'abc', dither: 'yes' }));
  assert.deepEqual(loadPrefs(), DEFAULT_PREFS);
  store(JSON.stringify({ palette: 'rose', mode: 'dark', level: 99, dither: true }));
  assert.deepEqual(loadPrefs(), { ...DEFAULT_PREFS, palette: 'rose', mode: 'dark', dither: true });
});

test('a level must be a real number level, not a string or an inherited key', () => {
  for (const level of ['8', [8], 'toString', null]) {
    store(JSON.stringify({ level }));
    assert.equal(loadPrefs().level, DEFAULT_PREFS.level);
  }
  store(JSON.stringify({ level: 12 }));
  assert.equal(loadPrefs().level, 12);
});

test('level options carry numeric values', () => {
  assert.ok(LEVEL_OPTIONS.every(({ value }) => Number.isInteger(value)));
});
