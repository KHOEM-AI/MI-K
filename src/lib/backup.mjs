function bytesToBase64(bytes) {
  let binary = "";
  const size = 0x8000;

  for (let i = 0; i < bytes.length; i += size) {
    binary += String.fromCharCode(...bytes.subarray(i, i + size));
  }

  return btoa(binary);
}

function base64ToBytes(data) {
  if (
    typeof data !== "string" ||
    data.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)
  ) {
    throw new Error("Invalid asset binary data.");
  }

  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  if (bytesToBase64(bytes) !== data) {
    throw new Error("Invalid asset binary encoding.");
  }

  return bytes;
}

function validAsset(item) {
  if (
    !item ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    typeof item.type !== "string" ||
    typeof item.data !== "string" ||
    !Number.isFinite(item.lastModified) ||
    (item.kind !== "image" && item.kind !== "model")
  ) {
    return false;
  }

  const name = item.name.toLowerCase();
  const isImage = /\.(png|jpe?g|webp|gif)$/.test(name);
  const isModel = /\.(glb|gltf)$/.test(name);

  if (item.kind === "image" && !isImage) return false;
  if (item.kind === "model" && !isModel) return false;

  if (item.type) {
    if (item.kind === "image" && !item.type.startsWith("image/")) {
      return false;
    }

    if (
      item.kind === "model" &&
      ![
        "model/gltf-binary",
        "model/gltf+json",
        "application/json",
        "application/octet-stream",
      ].includes(item.type)
    ) {
      return false;
    }
  }

  return true;
}

export async function createBackupJSON(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error("No assets to export.");
  }

  const backup = {
    format: "KHOEM-AI-ASSETS",
    version: 1,
    assets: await Promise.all(
      assets.map(async (asset) => ({
        name: asset.file.name,
        type: asset.file.type || "",
        lastModified: asset.file.lastModified,
        kind: asset.kind,
        data: bytesToBase64(
          new Uint8Array(await asset.file.arrayBuffer())
        ),
      }))
    ),
  };

  return JSON.stringify(backup);
}

export async function restoreBackupJSON(json) {
  let backup;

  try {
    backup = JSON.parse(json);
  } catch {
    throw new Error("Backup JSON is not valid.");
  }

  if (
    !backup ||
    backup.format !== "KHOEM-AI-ASSETS" ||
    backup.version !== 1 ||
    !Array.isArray(backup.assets)
  ) {
    throw new Error("Unsupported KHOEM-AI backup format.");
  }

  if (backup.assets.length > 1000) {
    throw new Error("Backup contains too many assets.");
  }

  const restored = [];

  for (const item of backup.assets) {
    if (!validAsset(item)) {
      throw new Error("Backup contains invalid asset metadata.");
    }

    const bytes = base64ToBytes(item.data);
    const blob = new Blob([bytes], { type: item.type });

    const file = new File([blob], item.name, {
      type: item.type,
      lastModified: item.lastModified,
    });

    restored.push({
      id: `${Date.now()}-${Math.random()}-${restored.length}`,
      file,
      kind: item.kind,
    });
  }

  return restored;
}
