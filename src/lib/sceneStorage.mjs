const KEY = "khoem-ai.scenes.v1";

export function listScenes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("listScenes failed:", error);
    return [];
  }
}

export function saveScene(scene) {
  const scenes = listScenes();
  const idx = scenes.findIndex((s) => s && s.id === scene.id);
  if (idx >= 0) scenes[idx] = scene;
  else scenes.unshift(scene);
  try {
    localStorage.setItem(KEY, JSON.stringify(scenes));
    return true;
  } catch (error) {
    console.error("saveScene failed:", error);
    return false;
  }
}

export function deleteScene(id) {
  const scenes = listScenes().filter((s) => s && s.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(scenes));
    return true;
  } catch (error) {
    console.error("deleteScene failed:", error);
    return false;
  }
}

export function loadScene(id) {
  return listScenes().find((s) => s && s.id === id) ?? null;
}
