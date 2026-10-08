import assert from 'node:assert/strict';
import test from 'node:test';
import { BIT_LEVELS } from '../src/core/levels/levels.js';
import { bayer, convert, enhance, pixelate, quantizeChannel, quantizeImage } from '../src/features/convert/convert.js';

/** Opaque gray image whose value in column x is valueAt(x). */
const gray = (width, height, valueAt) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const v = valueAt(i % width);
    data.set([v, v, v, 255], i * 4);
  }
  return { width, height, data };
};
const ramp = () => gray(16, 8, (x) => x * 17);
const distinctReds = (img) => new Set(img.data.filter((_, i) => i % 4 === 0)).size;
/** Distinct red values in each column of an image. */
const distinctPerColumn = ({ width, height, data }) =>
  Array.from({ length: width }, (_, x) => new Set(Array.from({ length: height }, (_, y) => data[(y * width + x) * 4])).size);

test('quantizeChannel keeps black and white at any depth', () => {
  assert.equal(quantizeChannel(0, 3), 0);
  assert.equal(quantizeChannel(255, 3), 255);
});

test('quantizeChannel snaps to the nearest of 2^bits levels', () => {
  assert.equal(quantizeChannel(100, 2), 85);
  assert.equal(quantizeChannel(128, 1), 255);
});

test('bit levels map to real channel depths', () => {
  assert.deepEqual(BIT_LEVELS[8].bits, [3, 3, 2]);
  assert.deepEqual(BIT_LEVELS[16].bits, [5, 6, 5]);
  assert.deepEqual(BIT_LEVELS[32].bits, [8, 8, 8]);
});

test('quantizeImage changes rgb and leaves alpha alone', () => {
  const img = { width: 1, height: 1, data: new Uint8ClampedArray([100, 100, 100, 77]) };
  const out = quantizeImage(img, [2, 2, 2]);
  assert.deepEqual([...out.data], [85, 85, 85, 77]);
});

test('pixelate averages blocks down to the target grid', () => {
  const img = {
    width: 4,
    height: 2,
    data: new Uint8ClampedArray([
      0, 0, 0, 255, 100, 0, 0, 255, 200, 0, 0, 255, 200, 0, 0, 255, 0, 0, 0, 255, 100, 0, 0, 255, 200, 0, 0, 255, 200, 0, 0, 255,
    ]),
  };
  const out = pixelate(img, 2);
  assert.equal(out.width, 2);
  assert.equal(out.height, 1);
  assert.deepEqual([...out.data], [50, 0, 0, 255, 200, 0, 0, 255]);
});

test('pixelate never upscales a small image', () => {
  const img = { width: 2, height: 2, data: new Uint8ClampedArray(16).fill(9) };
  assert.equal(pixelate(img, 64).width, 2);
});

test('bayer thresholds are 16 distinct values centred on zero', () => {
  const values = new Set();
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) values.add(bayer(x, y));
  assert.equal(values.size, 16);
  assert.ok([...values].every((v) => v > -0.5 && v < 0.5));
  assert.equal(bayer(0, 0), bayer(4, 4));
});

test('dithering mixes two levels across a gradient', () => {
  assert.equal(distinctPerColumn(quantizeImage(ramp(), [1, 1, 1], { dither: false }))[7], 1);
  assert.equal(distinctPerColumn(quantizeImage(ramp(), [1, 1, 1], { dither: true }))[7], 2);
});

test('a solid color stays one solid color even between palette levels', () => {
  assert.equal(distinctReds(quantizeImage(gray(8, 8, () => 128), [1, 1, 1], { dither: true })), 1);
});

test('solid color with slight jpeg-style noise still stays solid', () => {
  assert.equal(distinctReds(quantizeImage(gray(8, 8, (x) => 128 + (x % 2)), [1, 1, 1], { dither: true })), 1);
});

test('enhance boosts saturation but leaves grays and alpha alone', () => {
  const img = { width: 2, height: 1, data: new Uint8ClampedArray([200, 100, 100, 50, 128, 128, 128, 255]) };
  const out = enhance(img, { saturation: 1.5, contrast: 1 });
  assert.ok(out.data[0] - out.data[1] > 100);
  assert.equal(out.data[3], 50);
  assert.deepEqual([...out.data.slice(4, 8)], [128, 128, 128, 255]);
});

test('convert keeps image dimensions within the level grid', () => {
  const data = new Uint8ClampedArray(200 * 100 * 4).fill(120);
  const out = convert({ width: 200, height: 100, data }, 8);
  assert.equal(out.width, 64);
  assert.equal(out.height, 32);
});

test('every bit level uses its own depth, capped at 24-bit color, with a growing grid', () => {
  const levels = Object.keys(BIT_LEVELS).map(Number);
  assert.ok(levels.includes(10));
  let lastGrid = 0;
  for (const level of levels) {
    const { bits, grid } = BIT_LEVELS[level];
    assert.equal(
      bits.reduce((a, b) => a + b, 0),
      Math.min(level, 24),
      `${level}-bit`,
    );
    assert.ok(bits.every((b) => b >= 1));
    assert.ok(grid > lastGrid, `${level}-bit grid grows`);
    lastGrid = grid;
  }
});

test('nothing is dithered unless asked for', () => {
  assert.ok(distinctPerColumn(quantizeImage(ramp(), [1, 1, 1])).every((n) => n === 1));
});

test('convert passes the dither option through', () => {
  const gradient = gray(64, 8, (x) => x * 4);
  const mixedColumns = (img) => distinctPerColumn(img).filter((n) => n > 1).length;
  assert.equal(mixedColumns(convert(gradient, 8)), 0);
  assert.ok(mixedColumns(convert(gradient, 8, { dither: true })) > 0);
});