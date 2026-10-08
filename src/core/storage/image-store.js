// The picked image travels from the input page to the viewer as a Blob in IndexedDB: lossless (no re-encoding
// noise) and without sessionStorage's ~5 MB string quota.
const DB = 'art8', STORE = 'image', KEY = 'current';

const run = async (mode, operation) => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
};

/** Both reject when storage is unavailable or full; callers report it. loadImage resolves undefined when nothing is stored. */
export const saveImage = (blob) => run('readwrite', (store) => store.put(blob, KEY));
export const loadImage = () => run('readonly', (store) => store.get(KEY));