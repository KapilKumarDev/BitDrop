import test from 'node:test';
import assert from 'node:assert/strict';
import { clampZoom, stepZoom, MIN_ZOOM, MAX_ZOOM } from '../src/features/zoom-modal/zoom.js';

test('clampZoom stays inside bounds', () => {
  assert.equal(clampZoom(0.1), MIN_ZOOM);
  assert.equal(clampZoom(99), MAX_ZOOM);
  assert.equal(clampZoom(2), 2);
});

test('stepZoom zooms in and out and stops at the limits', () => {
  assert.equal(stepZoom(1, 1), 1.5);
  assert.equal(stepZoom(MIN_ZOOM, -1), MIN_ZOOM);
  assert.equal(stepZoom(MAX_ZOOM, 1), MAX_ZOOM);
});
