export type StoredAsset = {
  id: string;
  kind: "image" | "model";
  file: File;
};

export function saveAsset(asset: StoredAsset): Promise<boolean>;
export function getAssets(): Promise<StoredAsset[]>;
export function deleteAsset(id: string): Promise<boolean>;
