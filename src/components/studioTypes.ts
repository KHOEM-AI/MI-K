export type Shape = "box" | "sphere" | "cone" | "cylinder" | "torus" | "text" | "car" | "sportcar";
export type Vector3 = { x: number; y: number; z: number };

export type SceneObject = {
  id: string;
  name: string;
  shape: Shape;
  color: string;
  metalness: number;
  roughness: number;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  visible?: boolean;
  locked?: boolean;
  textureData?: string | null;
  glbData?: string | null;
  text?: string;
  groupId?: string;
  groupName?: string;
};

export type StudioAsset = {
  id: string;
  file: File;
  kind: "model";
};

export type Studio3DProps = {
  onAssetSaved?: (asset: StudioAsset) => void;
};
