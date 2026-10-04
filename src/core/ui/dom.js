/** Every element that has an id, keyed by id: `const ui = ids(); ui.stage`. */
export const ids = () => Object.fromEntries(Array.from(document.querySelectorAll('[id]'), (el) => [el.id, el]));

/** Shows a message in the page's #note status line. */
export const report = (message) => {
  document.getElementById('note').textContent = message;
};
