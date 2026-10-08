/** Channel depth per level; grid is the longest side in pixels. Color depth tops out at 24-bit, so 32-bit only adds resolution. */
export const BIT_LEVELS = {
  4: { label: '4-bit', bits: [2, 1, 1], grid: 48 },
  6: { label: '6-bit', bits: [2, 2, 2], grid: 56 },
  8: { label: '8-bit', bits: [3, 3, 2], grid: 64 },
  10: { label: '10-bit', bits: [3, 4, 3], grid: 80 },
  12: { label: '12-bit', bits: [4, 4, 4], grid: 96 },
  16: { label: '16-bit', bits: [5, 6, 5], grid: 128 },
  24: { label: '24-bit', bits: [8, 8, 8], grid: 192 },
  32: { label: '32-bit', bits: [8, 8, 8], grid: 256 },
};

/** Options for a level picker; values are numbers. */
export const LEVEL_OPTIONS = Object.entries(BIT_LEVELS).map(([value, { label }]) => ({ value: Number(value), label }));