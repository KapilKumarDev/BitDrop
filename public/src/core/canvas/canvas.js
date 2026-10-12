export const createCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });

/** PNG blob of a canvas (toBlob defaults to PNG); rejects when the browser cannot encode it. */
export const toBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The canvas could not be encoded as PNG'))));
  });

/** Rejects when encoding fails, so callers can tell the person. */
export const downloadCanvas = async (canvas, name) => {
  const url = URL.createObjectURL(await toBlob(canvas));
  Object.assign(document.createElement('a'), {
    href: url,
    download: name,
  }).click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000); // revoking right after click() can cancel the download in some browsers
};

/** Reads a Blob as a data: URL. Unlike a blob: URL it loads in every engine, including WebKit's ephemeral sessions. */
export const toDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** Decodes an image Blob into a ready-to-draw <img> (works in every engine); rejects when the browser cannot read it. */
export const decodeImage = async (blob) => {
  const image = new Image();
  image.src = await toDataUrl(blob);
  await image.decode();
  return image;
};
