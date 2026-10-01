/** Single-choice button group. options: [{ value, label }]; values compare as strings. */
export const mountSegmented = (el, options, value, onChange) => {
  el.setAttribute('role', 'radiogroup');
  el.replaceChildren(
    ...options.map((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'seg';
      button.setAttribute('role', 'radio');
      button.dataset.value = option.value;
      button.textContent = option.label;
      return button;
    }),
  );
  const select = (next) => {
    for (const button of el.children) button.setAttribute('aria-checked', String(button.dataset.value === String(next)));
  };
  select(value);
  el.addEventListener('click', (event) => {
    const button = event.target.closest('.seg');
    if (!button) return;
    select(button.dataset.value);
    onChange(button.dataset.value);
  });
  return select;
};
