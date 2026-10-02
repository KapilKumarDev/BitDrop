/** Every element that has an id, keyed by id: `const ui = ids(); ui.stage`. */
export const ids = (root = document) => Object.fromEntries(Array.from(root.querySelectorAll('[id]'), (el) => [el.id, el]));
