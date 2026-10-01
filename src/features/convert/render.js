export const loadPixels = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = reject;
    img.src = src;
  });

export const toCanvas = ({ width, height, data }) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').putImageData(new ImageData(data, width, height), 0, 0);
  return canvas;
};

/** Nearest-neighbour integer upscale so every art pixel stays a crisp square. */
export const upscale = (canvas, minSide) => {
  const factor = Math.max(1, Math.ceil(minSide / Math.max(canvas.width, canvas.height)));
  const out = document.createElement('canvas');
  out.width = canvas.width * factor;
  out.height = canvas.height * factor;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};
