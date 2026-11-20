/* ============================================================
   Village Save/Load — localStorage
   ============================================================ */
export interface VillageSaveState {
  version: 1;
  timestamp: number;
  time: {
    hour: number;
    speed: number;
    running: boolean;
  };
  weather: {
    isRaining: boolean;
    isNight: boolean;
  };
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  stats: {
    totalFamilies: number;
    totalPeople: number;
    totalLights: number;
  };
}

const STORAGE_KEY = "mi-k-village-save-v1";

export function saveVillage(state: VillageSaveState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error("Save failed:", err);
    return false;
  }
}

export function loadVillage(): VillageSaveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return null;
    return parsed;
  } catch (err) {
    console.error("Load failed:", err);
    return null;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function clearSave(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/* Auto-save រៀងរាល់ ៣០ វិនាទី */
export function startAutoSave(
  getState: () => VillageSaveState
): () => void {
  const interval = setInterval(() => {
    saveVillage(getState());
  }, 30000);
  return () => clearInterval(interval);
}
