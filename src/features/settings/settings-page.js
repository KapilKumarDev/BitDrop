import { PALETTES } from '../../core/theme/palettes.js';
import { loadPrefs, savePrefs } from '../../core/storage/prefs.js';
import { mountSegmented } from '../../core/ui/segmented.js';
import { BIT_LEVELS } from '../convert/convert.js';

const prefs = loadPrefs();

mountSegmented(
  document.getElementById('mode'),
  [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Auto' }],
  prefs.mode,
  (mode) => savePrefs({ mode }),
);
mountSegmented(
  document.getElementById('level'),
  Object.entries(BIT_LEVELS).map(([value, { label }]) => ({ value, label })),
  String(prefs.level),
  (level) => savePrefs({ level: Number(level) }),
);

const palette = document.getElementById('palette');
const swatches = Object.entries(PALETTES).map(([name, label]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'swatch';
  button.setAttribute('aria-label', label);
  button.dataset.palette = name;
  button.setAttribute('aria-pressed', String(name === prefs.palette));
  button.addEventListener('click', () => {
    savePrefs({ palette: name });
    swatches.forEach((swatch) => swatch.setAttribute('aria-pressed', String(swatch === button)));
  });
  return button;
});
palette.append(...swatches);
