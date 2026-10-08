import assert from 'node:assert/strict';
import test from 'node:test';
import { splitFromPointer, stepSplit } from '../src/features/compare/compare.js';

test('splitFromPointer maps a pointer x to a percentage of the stage width', () => {
  assert.equal(splitFromPointer(150, 100, 200), 25);
});

test('splitFromPointer clamps outside the stage and survives a zero width', () => {
  assert.equal(splitFromPointer(0, 100, 200), 0);
  assert.equal(splitFromPointer(900, 100, 200), 100);
  assert.equal(splitFromPointer(150, 100, 0), 50);
});

test('stepSplit moves with arrow keys, jumps with Home/End, ignores other keys', () => {
  assert.equal(stepSplit(50, 'ArrowRight'), 55);
  assert.equal(stepSplit(50, 'ArrowLeft'), 45);
  assert.equal(stepSplit(98, 'ArrowRight'), 100);
  assert.equal(stepSplit(50, 'Home'), 0);
  assert.equal(stepSplit(50, 'End'), 100);
  assert.equal(stepSplit(50, 'a'), 50);
});