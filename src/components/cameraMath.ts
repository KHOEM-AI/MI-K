export type CameraPresetName = "front" | "top" | "iso";
export type CameraView = {
  position: [number, number, number];
  target: [number, number, number];
};

export const CAMERA_PRESETS: Record<CameraPresetName, CameraView> = {
  front: { position: [0, 0, 10], target: [0, 0, 0] },
  // the small Z offset on "top" avoids gimbal lock
  top: { position: [0, 10, 0.01], target: [0, 0, 0] },
  iso: { position: [4, 3, 7], target: [0, 0, 0] },
};

export function cameraForPreset(preset: string): CameraView {
  return Object.prototype.hasOwnProperty.call(CAMERA_PRESETS, preset)
    ? CAMERA_PRESETS[preset as CameraPresetName]
    : CAMERA_PRESETS.iso;
}
