import { BIT_LEVELS } from '../../core/levels/levels.js';

const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Ordered-dither threshold for a pixel, in level steps, centred on zero. */
export const bayer = (x, y) => (BAYER_4X4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;

export const quantizeChannel = (value, bits, offset = 0) => {
  const steps = (1 << bits) - 1;
  const level = Math.min(steps, Math.max(0, Math.round((value / 255) * steps + offset)));
  return Math.round((level / steps) * 255);
};

const FLAT_TOLERANCE = 2; // source photos carry their own jpeg noise; real gradients step by more than this per cell

const sameColor = (data, i, j) =>
  Math.abs(data[i] - data[j]) <= FLAT_TOLERANCE &&
  Math.abs(data[i + 1] - data[j + 1]) <= FLAT_TOLERANCE &&
  Math.abs(data[i + 2] - data[j + 2]) <= FLAT_TOLERANCE;

/** True when every neighbour has (almost) the same color, so dithering would only add noise. */
const isFlat = (data, width, height, x, y) => {
  const i = (y * width + x) * 4;
  return (
    (x === 0 || sameColor(data, i, i - 4)) &&
    (x === width - 1 || sameColor(data, i, i + 4)) &&
    (y === 0 || sameColor(data, i, i - width * 4)) &&
    (y === height - 1 || sameColor(data, i, i + width * 4))
  );
};

export const quantizeImage = ({ width, height, data }, [rBits, gBits, bBits], { dither = false } = {}) => {
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const offset = dither && !isFlat(data, width, height, x, y) ? bayer(x, y) : 0;
      out[i] = quantizeChannel(out[i], rBits, offset);
      out[i + 1] = quantizeChannel(out[i + 1], gBits, offset);
      out[i + 2] = quantizeChannel(out[i + 2], bBits, offset);
    }
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
