import { createCanvas, decodeImage } from '../../core/canvas/canvas.js';

/** Decodes an image Blob into RGBA pixels. */
export const loadPixels = async (blob) => {
  const image = await decodeImage(blob);
  const { naturalWidth: width, naturalHeight: height } = image;
  const ctx = createCanvas(width, height).getContext('2d');
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, width, height);
};

export const toCanvas = ({ width, height, data }) => {
  const canvas = createCanvas(width, height);
  canvas.getContext('2d').putImageData(new ImageData(data, width, height), 0, 0);
  return canvas;
};

/** Nearest-neighbour integer upscale so every art pixel stays a crisp square. */
export const upscale = (canvas, minSide) => {
  const factor = Math.max(1, Math.ceil(minSide / Math.max(canvas.width, canvas.height)));
  const out = createCanvas(canvas.width * factor, canvas.height * factor);
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};
