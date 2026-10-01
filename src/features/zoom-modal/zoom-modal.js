import { clampZoom, stepZoom, MIN_ZOOM } from './zoom.js';

const TEMPLATE = `
  <div class="modal__stage"><img class="modal__img" alt="" draggable="false"></div>
  <div class="modal__bar">
    <button class="btn btn--tonal" type="button" data-act="back">Back</button>
    <button class="btn btn--outlined" type="button" data-act="out" aria-label="Zoom out">&minus;</button>
    <output class="modal__level" aria-live="polite">100%</output>
    <button class="btn btn--filled" type="button" data-act="in" aria-label="Zoom in">+</button>
  </div>`;

/** Opens a full-screen overlay for one image. Closes on Back, Escape, or a click outside the image. */
export const openImageModal = (src, alt) => {
  const root = document.createElement('div');
  root.className = 'modal';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', alt);
  root.innerHTML = TEMPLATE;
  const stage = root.querySelector('.modal__stage');
  const image = root.querySelector('.modal__img');
  const level = root.querySelector('.modal__level');
  image.src = src;
  image.alt = alt;

  const opener = document.activeElement;
  let zoom = MIN_ZOOM;
  let [x, y] = [0, 0];
  let drag = null;

  const render = () => {
    root.style.setProperty('--zoom', zoom);
    root.style.setProperty('--x', x);
    root.style.setProperty('--y', y);
    level.textContent = `${Math.round(zoom * 100)}%`;
  };
  const setZoom = (next) => {
    zoom = clampZoom(next);
    if (zoom === MIN_ZOOM) [x, y] = [0, 0];
    render();
  };
  const close = () => {
    document.removeEventListener('keydown', onKey);
    root.remove();
    opener?.focus();
  };
  const onKey = (event) => event.key === 'Escape' && close();

  root.addEventListener('click', (event) => {
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (act === 'back') close();
    else if (act === 'in') setZoom(stepZoom(zoom, 1));
    else if (act === 'out') setZoom(stepZoom(zoom, -1));
    else if (event.target === stage || event.target === root) close();
  });
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(stepZoom(zoom, -Math.sign(event.deltaY)));
  }, { passive: false });
  image.addEventListener('pointerdown', (event) => {
    drag = { px: event.clientX - x, py: event.clientY - y };
    image.setPointerCapture(event.pointerId);
  });
  image.addEventListener('pointermove', (event) => {
    if (!drag || zoom === MIN_ZOOM) return;
    [x, y] = [event.clientX - drag.px, event.clientY - drag.py];
    render();
  });
  image.addEventListener('pointerup', () => { drag = null; });
  image.addEventListener('pointercancel', () => { drag = null; });

  document.addEventListener('keydown', onKey);
  document.body.append(root);
  render();
  root.querySelector('[data-act="back"]').focus();
};
