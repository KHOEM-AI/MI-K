export type SceneSnapshot = {
  id: string;
  name: string;
  objects: unknown[];
  ambientIntensity: number;
  directionalIntensity: number;
  createdAt: number;
  updatedAt: number;
};

export function listScenes(): SceneSnapshot[];
export function saveScene(scene: SceneSnapshot): boolean;
export function deleteScene(id: string): boolean;
export function loadScene(id: string): SceneSnapshot | null;
