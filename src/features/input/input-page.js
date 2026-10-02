import { saveImage } from '../../core/storage/image-store.js';

const MAX_SIDE = 1024;
const file = document.getElementById('file');
const drop = document.getElementById('drop');
const note = document.getElementById('note');

const toDataUrl = (bitmap) => {
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // transparent areas become white instead of black in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92);
};

const accept = async (picked) => {
  if (!picked?.type.startsWith('image/')) {
    note.textContent = 'That is not an image. Choose a PNG, JPG, WebP or GIF file.';
    return;
  }
  try {
    saveImage(toDataUrl(await createImageBitmap(picked)));
    location.href = 'viewer.html';
  } catch {
    note.textContent = 'This image could not be opened. Try a different or smaller one.';
  }
};

file.addEventListener('change', () => accept(file.files[0]));
drop.addEventListener('dragover', (event) => event.preventDefault());
drop.addEventListener('drop', (event) => {
  event.preventDefault();
  accept(event.dataTransfer.files[0]);
});
