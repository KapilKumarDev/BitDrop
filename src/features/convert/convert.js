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

const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Ordered-dither threshold for a pixel, in level steps, centred on zero. */
export const bayer = (x, y) => (BAYER_4X4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;

export const quantizeChannel = (value, bits, offset = 0) => {
  const steps = (1 << bits) - 1;
  const level = Math.min(steps, Math.max(0, Math.round((value / 255) * steps + offset)));
  return Math.round((level / steps) * 255);
};

const FLAT_TOLERANCE = 2; // covers jpeg noise; real gradients step by more than this per cell
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** True when every neighbour has (almost) the same color, so dithering would only add noise. */
const isFlat = (data, width, height, x, y) =>
  NEIGHBOURS.every(([dx, dy]) => {
    const [nx, ny] = [x + dx, y + dy];
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) return true;
    const [i, j] = [(y * width + x) * 4, (ny * width + nx) * 4];
    return [0, 1, 2].every((c) => Math.abs(data[i + c] - data[j + c]) <= FLAT_TOLERANCE);
  });

export const quantizeImage = ({ width, height, data }, [rBits, gBits, bBits], { dither = false } = {}) => {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    const [x, y] = [(i / 4) % width, Math.floor(i / 4 / width)];
    const offset = dither && !isFlat(data, width, height, x, y) ? bayer(x, y) : 0;
    out[i] = quantizeChannel(out[i], rBits, offset);
    out[i + 1] = quantizeChannel(out[i + 1], gBits, offset);
    out[i + 2] = quantizeChannel(out[i + 2], bBits, offset);
  }
  return { width, height, data: out };
};

/** Pushes colors away from gray (saturation) and from mid-tone (contrast) so limited palettes stay vivid. */
export const enhance = ({ width, height, data }, { saturation = 1.3, contrast = 1.12 } = {}) => {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    const luma = 0.299 * out[i] + 0.587 * out[i + 1] + 0.114 * out[i + 2];
    for (let c = 0; c < 3; c++) {
      const saturated = luma + (out[i + c] - luma) * saturation;
      out[i + c] = (saturated - 128) * contrast + 128;
    }
  }
  return { width, height, data: out };
};

/** Box-average downscale so the longest side is at most maxSide; never upscales. */
export const pixelate = ({ width, height, data }, maxSide) => {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));
  const out = new Uint8ClampedArray(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    const y0 = Math.floor((y * height) / outH);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / outH));
    for (let x = 0; x < outW; x++) {
      const x0 = Math.floor((x * width) / outW);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / outW));
      const sum = [0, 0, 0, 0];
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          for (let c = 0; c < 4; c++) sum[c] += data[(sy * width + sx) * 4 + c];
        }
      }
      const count = (y1 - y0) * (x1 - x0);
      for (let c = 0; c < 4; c++) out[(y * outW + x) * 4 + c] = Math.round(sum[c] / count);
    }
  }
  return { width: outW, height: outH, data: out };
};

export const convert = (image, level, options) => {
  const { bits, grid } = BIT_LEVELS[level];
  return quantizeImage(enhance(pixelate(image, grid)), bits, options);
};