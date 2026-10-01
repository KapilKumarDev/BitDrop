import { applyTheme } from '../../core/theme/theme-store.js';
import { PALETTES, accentFor } from '../../core/theme/color.js';
import { loadPrefs, savePrefs } from '../../core/storage/prefs.js';
import { mountSegmented } from '../../core/ui/segmented.js';
import { BIT_LEVELS } from '../convert/convert.js';

const update = (patch) => applyTheme(savePrefs(patch));
const prefs = loadPrefs();
applyTheme(prefs);

mountSegmented(
  document.getElementById('mode'),
  [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Auto' }],
  prefs.mode,
  (mode) => update({ mode }),
);
mountSegmented(
  document.getElementById('level'),
  Object.entries(BIT_LEVELS).map(([value, { label }]) => ({ value, label })),
  String(prefs.level),
  (level) => update({ level: Number(level) }),
);

const palette = document.getElementById('palette');
const swatches = Object.entries(PALETTES).map(([name, { hue, label }]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'swatch';
  button.setAttribute('aria-label', label);
  button.style.setProperty('--swatch', accentFor(hue));
  button.setAttribute('aria-pressed', String(name === prefs.palette));
  button.addEventListener('click', () => {
    update({ palette: name });
    swatches.forEach((swatch) => swatch.setAttribute('aria-pressed', String(swatch === button)));
  });
  return button;
});
palette.append(...swatches);
