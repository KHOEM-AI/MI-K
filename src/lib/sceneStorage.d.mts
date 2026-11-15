export type SceneSnapshot = {
  id: string;
  name: string;
  objects: unknown[];
  ambientIntensity: number;
  directionalIntensity: number;
  createdAt: number;
  updatedAt: number;
};

export type SceneExport = {
  version: number;
  exportedAt: number;
  app: string;
  scene: {
    name: string;
    objects: unknown[];
    ambientIntensity: number;
    directionalIntensity: number;
  };
};

export type ImportResult =
  | { ok: true; data: SceneSnapshot }
  | { ok: false; error: string };

export function listScenes(): SceneSnapshot[];
export function saveScene(scene: SceneSnapshot): boolean;
export function deleteScene(id: string): boolean;
export function loadScene(id: string): SceneSnapshot | null;
export function serializeSceneSnapshot(snapshot: SceneSnapshot): SceneExport;
export function parseImportedScene(raw: unknown): ImportResult;

export type AutobackupData = {
  objects: unknown[];
  ambientIntensity: number;
  directionalIntensity: number;
  sceneName: string;
  currentSceneId: string | null;
  savedAt: number;
};

export function writeAutobackup(payload: AutobackupData): boolean;
export function readAutobackup(): AutobackupData | null;
export function clearAutobackup(): boolean;
