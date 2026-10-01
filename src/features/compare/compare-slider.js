import { splitFromPointer, stepSplit } from './compare.js';

/** Drag anywhere on the stage (while data-view="compare") or use the handle's arrow keys. */
export const mountCompare = (stage, handle) => {
  let split = 50;
  let dragging = false;

  const set = (value) => {
    split = value;
    stage.style.setProperty('--split', `${split}%`);
    handle.setAttribute('aria-valuenow', Math.round(split));
  };
  const follow = (event) => {
    const { left, width } = stage.getBoundingClientRect();
    set(splitFromPointer(event.clientX, left, width));
  };
  const stop = () => {
    dragging = false;
    stage.classList.remove('is-dragging');
  };

  stage.addEventListener('pointerdown', (event) => {
    if (stage.dataset.view !== 'compare') return;
    dragging = true;
    stage.classList.add('is-dragging');
    stage.setPointerCapture(event.pointerId);
    follow(event);
  });
  stage.addEventListener('pointermove', (event) => dragging && follow(event));
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  handle.addEventListener('keydown', (event) => {
    const next = stepSplit(split, event.key);
    if (next === split) return;
    event.preventDefault();
    set(next);
  });

  set(split);
  return {
    /** Wipes in from the right edge to the middle, once per time Compare is chosen. */
    sweepIn() {
      stage.classList.remove('is-sweeping');
      set(100);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        stage.classList.add('is-sweeping');
        set(50);
      }));
    },
  };
};
