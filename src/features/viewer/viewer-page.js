import { applyTheme } from '../../core/theme/theme-store.js';
import { loadPrefs, savePrefs } from '../../core/storage/prefs.js';
import { loadImage } from '../../core/storage/image-store.js';
import { mountSegmented } from '../../core/ui/segmented.js';
import { BIT_LEVELS, convert } from '../convert/convert.js';
import { loadPixels, toCanvas, upscale } from '../convert/render.js';
import { downloadCanvas } from '../export/export.js';
import { mountCompare } from '../compare/compare-slider.js';
import { openImageModal } from '../zoom-modal/zoom-modal.js';

const EXPORT_MIN_SIDE = 1024;
const stage = document.getElementById('stage');
const art = document.getElementById('art');
const original = document.getElementById('original');
const compare = document.getElementById('compare');
const artTag = document.getElementById('art-tag');
const note = document.getElementById('note');

const VIEWS = [
  { value: 'art', label: 'Pixel art' },
  { value: 'original', label: 'Original' },
  { value: 'compare', label: 'Compare' },
];

const start = async () => {
  const source = loadImage();
  if (!source) {
    location.replace('index.html');
    return;
  }
  const pixels = await loadPixels(source);
  const cache = new Map();
  const canvasFor = (level, dither) => {
    const key = `${level}:${dither}`;
    if (!cache.has(key)) cache.set(key, upscale(toCanvas(convert(pixels, level, { dither })), EXPORT_MIN_SIDE));
    return cache.get(key);
  };

  let { level, dither } = loadPrefs();
  const ditherButton = document.getElementById('dither');
  ditherButton.setAttribute('aria-pressed', String(dither));
  const slider = mountCompare(stage, compare);
  const showLevel = () => {
    art.src = canvasFor(level, dither).toDataURL();
    artTag.textContent = BIT_LEVELS[level].label;
  };

  original.src = source;
  showLevel();

  mountSegmented(document.getElementById('view'), VIEWS, 'art', (view) => {
    stage.dataset.view = view;
    compare.hidden = view !== 'compare';
    if (view === 'compare') slider.sweepIn();
  });
  mountSegmented(
    document.getElementById('levels'),
    Object.entries(BIT_LEVELS).map(([value, { label }]) => ({ value, label })),
    String(level),
    (value) => { level = Number(value); showLevel(); },
  );
  ditherButton.addEventListener('click', () => {
    dither = !dither;
    savePrefs({ dither });
    ditherButton.setAttribute('aria-pressed', String(dither));
    showLevel();
  });
  document.getElementById('zoom').addEventListener('click', () => {
    const showingOriginal = stage.dataset.view === 'original';
    openImageModal(showingOriginal ? source : art.src, showingOriginal ? 'Original image' : 'Pixel art version');
  });
  document.getElementById('export').addEventListener('click', () => downloadCanvas(canvasFor(level, dither), `pixel-art-${level}bit.png`));
};

applyTheme();
start().catch(() => { note.textContent = 'This image could not be shown. Go back and choose another one.'; });