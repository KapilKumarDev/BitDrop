import { createCanvas, toBlob } from '../../core/canvas/canvas.js';
import { saveImage } from '../../core/storage/image-store.js';
import { ids } from '../../core/ui/dom.js';

const MAX_SIDE = 1024;
const ui = ids();

/** Decodes the file, shrinks it to MAX_SIDE and flattens transparency onto white; returns a lossless PNG Blob. */
const normalize = async (picked) => {
  const bitmap = await createImageBitmap(picked);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = createCanvas(Math.max(1, Math.round(bitmap.width * scale)), Math.max(1, Math.round(bitmap.height * scale)));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return toBlob(canvas);
};

const accept = async (picked) => {
  if (!picked?.type.startsWith('image/')) {
    ui.note.textContent = 'That is not an image. Choose a PNG, JPG, WebP or GIF file.';
    return;
  }
  let image;
  try {
    image = await normalize(picked);
  } catch {
    ui.note.textContent = 'This image could not be opened. Try a different one.';
    return;
  }
  try {
    await saveImage(image);
  } catch {
    ui.note.textContent = 'The browser would not keep the image for the next page. Check that storage is not full or blocked, then try again.';
    return;
  }
  location.href = 'viewer.html';
};

ui.file.addEventListener('change', () => accept(ui.file.files[0]));
ui.drop.addEventListener('dragover', (event) => event.preventDefault());
ui.drop.addEventListener('drop', (event) => {
  event.preventDefault();
  accept(event.dataTransfer.files[0]);
});
