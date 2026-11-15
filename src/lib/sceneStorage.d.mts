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
