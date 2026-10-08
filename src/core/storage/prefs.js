import { BIT_LEVELS } from '../levels/levels.js';
import { MODES } from '../theme/modes.js';
import { DEFAULT_PALETTE, PALETTES } from '../theme/palettes.js';

const KEY = 'art8:prefs';
export const DEFAULT_PREFS = { palette: DEFAULT_PALETTE, mode: 'system', level: 8, dither: false };

const isKeyOf = (table) => (value) => typeof value === 'string' && Object.hasOwn(table, value);

const IS_VALID = {
  palette: isKeyOf(PALETTES),
  mode: isKeyOf(MODES),
  level: (value) => Number.isInteger(value) && Object.hasOwn(BIT_LEVELS, value),
  dither: (value) => typeof value === 'boolean',
};

/** Stored values are untrusted: any that fails its check falls back to its default. */
const sanitize = (stored) =>
  Object.fromEntries(Object.entries(DEFAULT_PREFS).map(([key, fallback]) => [key, IS_VALID[key](stored?.[key]) ? stored[key] : fallback]));

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null; // unreadable or unavailable storage: sanitize turns this into the defaults
  }
};

export const loadPrefs = () => sanitize(read());

export const savePrefs = (patch) => {
  const next = { ...loadPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: the choice still applies for this page view */
  }
  dispatchEvent(new Event('prefschange')); // theme.js re-applies the theme
  return next;
};