const TARGET_LUMINANCE = 0.179; // contrast ~4.6:1 against both pure white and pure black
const SATURATION = 0.6;

export const PALETTES = {
  mint: { hue: 152, label: 'Mint' },
  sky: { hue: 205, label: 'Sky' },
  rose: { hue: 345, label: 'Rose' },
  lime: { hue: 85, label: 'Lime' },
  violet: { hue: 265, label: 'Violet' },
};

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const hslToHex = (h, s, l) => {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${[0, 8, 4].map((n) => Math.round(channel(n) * 255).toString(16).padStart(2, '0')).join('')}`;
};

/** Accent whose lightness is searched so it keeps equal contrast on white and black. */
export const accentFor = (hue) => {
  let [low, high] = [0, 1];
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (luminance(hslToHex(hue, SATURATION, mid)) < TARGET_LUMINANCE) low = mid;
    else high = mid;
  }
  return hslToHex(hue, SATURATION, (low + high) / 2);
};
