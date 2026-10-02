import { clampZoom, stepZoom, MIN_ZOOM } from './zoom.js';

const TEMPLATE = `
  <div class="modal__stage"><img class="modal__img" draggable="false"></div>
  <div class="modal__bar">
    <button class="btn btn--tonal" type="button" data-act="back">Back</button>
    <button class="btn btn--outlined" type="button" data-act="out" aria-label="Zoom out">&minus;</button>
    <output class="modal__level">100%</output>
    <button class="btn btn--filled" type="button" data-act="in" aria-label="Zoom in">+</button>
  </div>`;

/**
 * Full-screen native <dialog> for one image: the browser inerts the page behind it, keeps Tab inside, closes on
 * Escape and returns focus to the opener. Back and a click outside the image close it; wheel and pinch zoom, drag pans.
 */
export const openImageModal = (src, alt) => {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-label', alt);
  dialog.innerHTML = TEMPLATE;
  const stage = dialog.querySelector('.modal__stage');
  const image = Object.assign(dialog.querySelector('.modal__img'), { src, alt });
  const level = dialog.querySelector('.modal__level');

  let zoom = MIN_ZOOM;
  let [x, y] = [0, 0];
  let pinch = 0; // distance between two fingers at the last move
  const pointers = new Map();

  const render = () => {
    dialog.style.setProperty('--zoom', zoom);
    dialog.style.setProperty('--x', x);
    dialog.style.setProperty('--y', y);
    level.textContent = `${Math.round(zoom * 100)}%`;
  };
  const setZoom = (next) => {
    zoom = clampZoom(next);
    if (zoom === MIN_ZOOM) [x, y] = [0, 0];
    render();
  };
  const release = (event) => {
    pointers.delete(event.pointerId);
    pinch = 0;
  };

  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', (event) => {
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (act === 'back' || event.target === stage || event.target === dialog) dialog.close();
    else if (act === 'in') setZoom(stepZoom(zoom, 1));
    else if (act === 'out') setZoom(stepZoom(zoom, -1));
  });
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(stepZoom(zoom, -Math.sign(event.deltaY)));
  }, { passive: false });
  image.addEventListener('pointerdown', (event) => {
    pointers.set(event.pointerId, event);
    pinch = 0;
    image.setPointerCapture(event.pointerId);
  });
  image.addEventListener('pointermove', (event) => {
    const last = pointers.get(event.pointerId);
    if (!last) return;
    pointers.set(event.pointerId, event);
    if (pointers.size === 2) {
      const [a, b] = pointers.values();
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch) setZoom((zoom * distance) / pinch);
      pinch = distance;
    } else if (zoom > MIN_ZOOM) {
      x += event.clientX - last.clientX;
      y += event.clientY - last.clientY;
      render();
    }
  });
  image.addEventListener('pointerup', release);
  image.addEventListener('pointercancel', release);

  document.body.append(dialog);
  dialog.showModal();
  render();
};
