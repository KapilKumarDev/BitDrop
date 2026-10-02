import { downloadCanvas } from '../../core/canvas/canvas.js';
import { BIT_LEVELS, LEVEL_OPTIONS } from '../../core/levels/levels.js';
import { loadImage } from '../../core/storage/image-store.js';
import { loadPrefs, savePrefs } from '../../core/storage/prefs.js';
import { ids } from '../../core/ui/dom.js';
import { mountSegmented } from '../../core/ui/segmented.js';
import { mountCompare } from '../compare/compare-slider.js';
import { convert } from '../convert/convert.js';
import { loadPixels, toCanvas, upscale } from '../convert/render.js';
import { openImageModal } from '../zoom-modal/zoom-modal.js';

const FULL_SIDE = 1024; // zoom and export render the grid at least this big; the stage shows the small grid
const ui = ids();
const report = (message) => { ui.note.textContent = message; };

const VIEWS = [
  { value: 'art', label: 'Pixel art' },
  { value: 'original', label: 'Original' },
  { value: 'compare', label: 'Compare' },
];

const start = async () => {
  let source;
  try {
    source = await loadImage();
  } catch {
    report('The browser could not read the stored image. Go back and choose it again.');
    return;
  }
  if (!source) {
    location.replace('index.html');
    return;
  }
  const pixels = await loadPixels(source);
  const originalUrl = URL.createObjectURL(source);
  const cache = new Map();
  const artFor = (level, dither) => {
    const key = `${level}:${dither}`;
    if (!cache.has(key)) {
      const canvas = toCanvas(convert(pixels, level, { dither }));
      cache.set(key, { canvas, url: canvas.toDataURL() });
    }
    return cache.get(key);
  };

  let { level, dither } = loadPrefs();
  const fullSizeCanvas = () => upscale(artFor(level, dither).canvas, FULL_SIDE);
  const slider = mountCompare(ui.stage, ui.compare);
  const showLevel = () => {
    ui.art.src = artFor(level, dither).url;
    ui.tag.textContent = BIT_LEVELS[level].label;
  };

  ui.original.src = originalUrl;
  ui.dither.setAttribute('aria-pressed', String(dither));
  showLevel();

  mountSegmented(ui.view, VIEWS, 'art', (view) => {
    ui.stage.dataset.view = view;
    ui.compare.hidden = view !== 'compare';
    if (view === 'compare') slider.sweepIn();
  });
  mountSegmented(ui.levels, LEVEL_OPTIONS, level, (value) => { level = value; showLevel(); });
  ui.dither.addEventListener('click', () => {
    dither = !dither;
    savePrefs({ dither });
    ui.dither.setAttribute('aria-pressed', String(dither));
    showLevel();
  });
  ui.zoom.addEventListener('click', () => {
    const showingOriginal = ui.stage.dataset.view === 'original';
    openImageModal(showingOriginal ? originalUrl : fullSizeCanvas().toDataURL(), showingOriginal ? 'Original image' : 'Pixel art version');
  });
  ui.export.addEventListener('click', () =>
    downloadCanvas(fullSizeCanvas(), `pixel-art-${level}bit.png`).catch(() => report('The image could not be exported. Try again.')),
  );
};

start().catch(() => report('This image could not be shown. Go back and choose another one.'));
