const STEP = 5;

const clamp = (value) => Math.min(100, Math.max(0, value));

/** Pointer x to a 0-100 split position within a stage that starts at `left` and is `width` wide. */
export const splitFromPointer = (clientX, left, width) => (width > 0 ? clamp(((clientX - left) / width) * 100) : 50);

export const stepSplit = (value, key) => {
  switch (key) {
    case 'ArrowLeft':
      return clamp(value - STEP);
    case 'ArrowRight':
      return clamp(value + STEP);
    case 'Home':
      return 0;
    case 'End':
      return 100;
    default:
      return value;
  }
};