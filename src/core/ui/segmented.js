/**
 * Single-choice group built from native radio inputs, so the browser supplies the arrow-key
 * navigation, the single tab stop and the checked state. el needs an id (the radio group name).
 * options: [{ value, label }]; onChange receives the chosen option's own value.
 */
export const mountSegmented = (el, options, value, onChange) => {
  el.setAttribute('role', 'radiogroup');
  el.replaceChildren(
    ...options.map((option, index) => {
      const seg = document.createElement('label');
      seg.className = 'seg';
      seg.dataset.value = option.value;
      const input = Object.assign(document.createElement('input'), {
        type: 'radio',
        name: el.id,
        value: index,
        checked: String(option.value) === String(value),
        className: 'visually-hidden',
      });
      const label = document.createElement('span');
      label.textContent = option.label;
      seg.append(input, label);
      return seg;
    }),
  );
  el.addEventListener('change', (event) => onChange(options[event.target.value].value));
};