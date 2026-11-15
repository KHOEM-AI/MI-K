const DB_NAME = "KHOEM-AI-ASSETS";
const STORE_NAME = "assets";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAsset(asset) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      id: asset.id,
      name: asset.file.name,
      type: asset.file.type,
      kind: asset.kind,
      file: asset.file
    });

    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAssets() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result.map(item => ({
        id: item.id,
        kind: item.kind,
        file: new File([item.file], item.name, {
          type: item.type
        })
      })));
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteAsset(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);

    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };

    tx.onerror = () => reject(tx.error);
  });
}
