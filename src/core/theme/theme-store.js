import { PALETTES, accentFor } from './color.js';
import { loadPrefs } from '../storage/prefs.js';

const systemDark = matchMedia('(prefers-color-scheme: dark)');

export const applyTheme = (prefs = loadPrefs()) => {
  const root = document.documentElement;
  const { hue } = PALETTES[prefs.palette] ?? PALETTES.mint;
  root.style.setProperty('--accent', accentFor(hue));
  root.dataset.mode = prefs.mode === 'system' ? (systemDark.matches ? 'dark' : 'light') : prefs.mode;
};

systemDark.addEventListener('change', () => applyTheme());

// Back/forward restores a cached page without running scripts, and other tabs can change prefs.
addEventListener('pageshow', (event) => event.persisted && applyTheme());
addEventListener('storage', () => applyTheme());
