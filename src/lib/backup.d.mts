export type BackupAsset = {
  id: string;
  file: File;
  kind: "image" | "model";
};

export function createBackupJSON(
  assets: BackupAsset[]
): Promise<string>;

export function restoreBackupJSON(
  json: string
): Promise<BackupAsset[]>;
