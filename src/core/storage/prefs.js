const KEY = 'art8:prefs';
export const DEFAULT_PREFS = { palette: 'mint', mode: 'system', level: 8, dither: false };

export const loadPrefs = () => {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const savePrefs = (patch) => {
  const next = { ...loadPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: the choice still applies for this page view */
  }
  return next;
};