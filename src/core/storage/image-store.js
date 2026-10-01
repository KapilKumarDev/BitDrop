const KEY = 'art8:image';

/** Throws when the browser storage quota is exceeded; callers report it. */
export const saveImage = (dataUrl) => sessionStorage.setItem(KEY, dataUrl);
export const loadImage = () => sessionStorage.getItem(KEY);
