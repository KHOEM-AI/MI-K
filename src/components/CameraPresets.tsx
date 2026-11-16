import { RotateCw } from "lucide-react";

type CameraPresetsProps = {
  setCameraPreset: (preset: "front" | "top" | "iso") => void;
  autoRotate: boolean;
  setAutoRotate: (value: boolean) => void;
};

export function CameraPresets({
  setCameraPreset,
  autoRotate,
  setAutoRotate,
}: CameraPresetsProps) {
  return (
    <div
      className="studio-controls"
      style={{ marginBottom: "8px", display: "flex", gap: "8px" }}
    >
      <button
        type="button"
        className="upload-button"
        onClick={() => setCameraPreset("front")}
        style={{ flex: 1 }}
      >
        Front
      </button>

      <button
        type="button"
        className="upload-button"
        onClick={() => setCameraPreset("top")}
        style={{ flex: 1 }}
      >
        Top
      </button>

      <button
        type="button"
        className="upload-button"
        onClick={() => setCameraPreset("iso")}
        style={{ flex: 1 }}
      >
        Iso
      </button>

      <button
        type="button"
        className={autoRotate ? "upload-button" : "filter"}
        onClick={() => setAutoRotate(!autoRotate)}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <RotateCw size={16} /> Auto Rotate
      </button>
    </div>
  );
}
