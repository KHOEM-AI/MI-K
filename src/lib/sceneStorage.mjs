const KEY = "khoem-ai.scenes.v1";
const EXPORT_VERSION = 1;
const VALID_SHAPES = ["box", "sphere", "cone", "cylinder", "torus"];

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

// ─── Export / Import helpers ────────────────────────────────────────────

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function isHexColor(v) {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function sanitizeVec3(v, fallback) {
  if (!v || typeof v !== "object") return { ...fallback };
  return {
    x: isFiniteNumber(v.x) ? v.x : fallback.x,
    y: isFiniteNumber(v.y) ? v.y : fallback.y,
    z: isFiniteNumber(v.z) ? v.z : fallback.z,
  };
}

function sanitizeObject(raw, index) {
  if (!raw || typeof raw !== "object") return null;
  const shape = VALID_SHAPES.includes(raw.shape) ? raw.shape : null;
  if (!shape) return null;
  return {
    id:
      typeof raw.id === "string" && raw.id
        ? raw.id
        : `imported-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.slice(0, 80)
        : `${shape[0].toUpperCase()}${shape.slice(1)} ${index + 1}`,
    shape,
    color: isHexColor(raw.color) ? raw.color : "#168de2",
    metalness: isFiniteNumber(raw.metalness) ? clamp(raw.metalness, 0, 1) : 0.25,
    roughness: isFiniteNumber(raw.roughness) ? clamp(raw.roughness, 0, 1) : 0.35,
    position: sanitizeVec3(raw.position, { x: 0, y: 0, z: 0 }),
    rotation: sanitizeVec3(raw.rotation, { x: 0, y: 0, z: 0 }),
    scale: sanitizeVec3(raw.scale, { x: 1, y: 1, z: 1 }),
    textureData:
      typeof raw.textureData === "string" && raw.textureData.startsWith("data:image")
        ? raw.textureData
        : null,
    glbData:
      typeof raw.glbData === "string" && raw.glbData.startsWith("data:")
        ? raw.glbData
        : null,
  };
}

export function serializeSceneSnapshot(snapshot) {
  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    app: "KHOEM-AI 3D Studio",
    scene: {
      name: snapshot.name,
      objects: snapshot.objects,
      ambientIntensity: snapshot.ambientIntensity,
      directionalIntensity: snapshot.directionalIntensity,
      backgroundColor: snapshot.backgroundColor,
    },
  };
}

export function parseImportedScene(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "ឯកសារ JSON មិនត្រឹមត្រូវ។" };
  }

  const maybeScene = raw.scene ?? raw;
  if (!maybeScene || typeof maybeScene !== "object") {
    return { ok: false, error: "រកមិនឃើញ scene object ក្នុងឯកសារ។" };
  }

  if (raw.version !== undefined && raw.version !== EXPORT_VERSION) {
    console.warn(
      "Import version mismatch:",
      raw.version,
      "expected",
      EXPORT_VERSION
    );
  }

  if (!Array.isArray(maybeScene.objects)) {
    return { ok: false, error: "Scene គ្មាន objects array។" };
  }

  if (maybeScene.objects.length === 0) {
    return { ok: false, error: "Scene គ្មានវត្ថុណាមួយ។" };
  }

  const sanitized = [];
  for (let i = 0; i < maybeScene.objects.length; i++) {
    const obj = sanitizeObject(maybeScene.objects[i], i);
    if (!obj) {
      return {
        ok: false,
        error: `វត្ថុទី ${i + 1} មិនត្រឹមត្រូវ (shape មិនស្គាល់)។`,
      };
    }
    sanitized.push(obj);
  }

  const now = Date.now();
  return {
    ok: true,
    data: {
      id: `imported-${now}-${Math.random().toString(36).slice(2, 9)}`,
      name:
        typeof maybeScene.name === "string" && maybeScene.name.trim()
          ? maybeScene.name.slice(0, 80)
          : `Imported ${new Date(now).toLocaleString()}`,
      objects: sanitized,
      ambientIntensity: isFiniteNumber(maybeScene.ambientIntensity)
        ? clamp(maybeScene.ambientIntensity, 0, 10)
        : 2,
      directionalIntensity: isFiniteNumber(maybeScene.directionalIntensity)
        ? clamp(maybeScene.directionalIntensity, 0, 10)
        : 3,
      backgroundColor:
        typeof maybeScene.backgroundColor === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(maybeScene.backgroundColor)
          ? maybeScene.backgroundColor
          : "#080f1b",
      createdAt: now,
      updatedAt: now,
    },
  };
}

// ─── Auto-backup helpers ────────────────────────────────────────────────

const AUTOBACKUP_KEY = "khoem-ai.autobackup.v1";
const AUTOBACKUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function writeAutobackup(payload) {
  try {
    localStorage.setItem(AUTOBACKUP_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("writeAutobackup failed:", error);
    return false;
  }
}

export function readAutobackup() {
  try {
    const raw = localStorage.getItem(AUTOBACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > AUTOBACKUP_MAX_AGE_MS) {
      localStorage.removeItem(AUTOBACKUP_KEY);
      return null;
    }
    if (!Array.isArray(parsed.objects)) return null;
    return parsed;
  } catch (error) {
    console.error("readAutobackup failed:", error);
    return null;
  }
}

export function clearAutobackup() {
  try {
    localStorage.removeItem(AUTOBACKUP_KEY);
    return true;
  } catch (error) {
    console.error("clearAutobackup failed:", error);
    return false;
  }
}
