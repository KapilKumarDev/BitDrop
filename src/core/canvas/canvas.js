const REVOKE_DELAY_MS = 30_000; // revoking right after click() can cancel the download in some browsers

export const createCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });

/** PNG blob of a canvas; rejects when the browser cannot encode it. */
export const toBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The canvas could not be encoded as PNG'))), 'image/png');
  });

/** Rejects when encoding fails, so callers can tell the person. */
export const downloadCanvas = async (canvas, name) => {
  const url = URL.createObjectURL(await toBlob(canvas));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
};
