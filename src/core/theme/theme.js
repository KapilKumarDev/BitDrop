// A classic script in the <head> of every page: unlike a module it blocks the first paint, so the stored
// theme is in place before anything is drawn. Missing or unknown values match no rule in theme.css, which
// then falls back to its defaults.
(() => {
  const apply = () => {
    let prefs = null;
    try {
      prefs = JSON.parse(localStorage.getItem('art8:prefs'));
    } catch {
      /* storage unavailable: the CSS defaults apply */
    }
    Object.assign(document.documentElement.dataset, { mode: prefs?.mode ?? '', palette: prefs?.palette ?? '' });
  };

  apply();
  addEventListener('prefschange', apply); // same tab: raised by savePrefs
  addEventListener('storage', apply); // other tabs
  addEventListener('pageshow', (event) => event.persisted && apply()); // a bfcache restore runs no scripts
})();
