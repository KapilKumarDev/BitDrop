import { LEVEL_OPTIONS } from '../../core/levels/levels.js';
import { loadPrefs, savePrefs } from '../../core/storage/prefs.js';
import { MODES } from '../../core/theme/modes.js';
import { PALETTES } from '../../core/theme/palettes.js';
import { ids } from '../../core/ui/dom.js';
import { mountSegmented } from '../../core/ui/segmented.js';

const ui = ids();
const prefs = loadPrefs();
const optionsOf = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const mount = (root, options, key) =>
  mountSegmented(root, options, prefs[key], (value) => savePrefs({ [key]: value }));

mount(ui.palette, optionsOf(PALETTES), 'palette');
mount(ui.mode, optionsOf(MODES), 'mode');
mount(ui.level, LEVEL_OPTIONS, 'level');

// Swatches are the same radio group, drawn in their own palette color with the name kept for screen readers.
for (const swatch of ui.palette.children) {
  swatch.dataset.palette = swatch.dataset.value;
  swatch.querySelector('span').classList.add('visually-hidden');
}

// With no earlier page (opened directly) there is nothing to go back to, so go home.
ui.back.addEventListener('click', () => (document.referrer ? history.back() : location.assign('index.html')));
