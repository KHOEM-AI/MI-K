import type { ChangeEvent } from "react";
import { MATERIAL_PRESETS } from "./studioConstants";
import type { SceneObject } from "./studioTypes";

type MaterialPanelProps = {
  selectedObject: SceneObject;
  updateSelectedColor: (value: string) => void;
  updateSelectedMaterial: (
    key: "metalness" | "roughness",
    value: number
  ) => void;
  applyMaterialPreset: (preset: {
    color: string;
    metalness: number;
    roughness: number;
  }) => void;
  handleTextureUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  clearTexture: (id: string) => void;
};

export function MaterialPanel({
  selectedObject,
  updateSelectedColor,
  updateSelectedMaterial,
  applyMaterialPreset,
  handleTextureUpload,
  clearTexture,
}: MaterialPanelProps) {
  return (
    <div className="studio-controls">
      <label>
        Material Color
        <input
          type="color"
          value={selectedObject.color}
          onChange={(event) => updateSelectedColor(event.target.value)}
          disabled={selectedObject.locked}
        />
      </label>

      <label>
        Texture Image (Max 1MB)
        <input
          type="file"
          accept="image/*"
          onChange={handleTextureUpload}
          disabled={selectedObject.locked}
          style={{ display: "none" }}
          id={`texture-upload-${selectedObject.id}`}
        />
        <button
          type="button"
          className="filter"
          disabled={selectedObject.locked}
          onClick={() =>
            document
              .getElementById(`texture-upload-${selectedObject.id}`)
              ?.click()
          }
          style={{ marginTop: "4px" }}
        >
          {selectedObject.textureData ? "Change Texture" : "Upload Texture"}
        </button>
      </label>

      {selectedObject.textureData && (
        <button
          type="button"
          className="filter"
          disabled={selectedObject.locked}
          onClick={() => clearTexture(selectedObject.id)}
        >
          Clear Texture
        </button>
      )}

      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "8px",
          flexWrap: "wrap",
        }}
      >
        {MATERIAL_PRESETS.map((preset) => {
          const Icon = preset.icon;

          return (
            <button
              key={preset.name}
              type="button"
              className="filter"
              onClick={() => applyMaterialPreset(preset)}
              disabled={selectedObject.locked}
              style={{
                flex: "1 1 30%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontSize: "0.8rem",
                padding: "6px",
              }}
              title={preset.name}
            >
              <Icon size={14} /> {preset.name}
            </button>
          );
        })}
      </div>

      <label>
        Metalness
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={selectedObject.metalness}
          onChange={(event) =>
            updateSelectedMaterial("metalness", Number(event.target.value))
          }
        />
        <small>{selectedObject.metalness.toFixed(2)}</small>
      </label>

      <label>
        Roughness
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={selectedObject.roughness}
          onChange={(event) =>
            updateSelectedMaterial("roughness", Number(event.target.value))
          }
        />
        <small>{selectedObject.roughness.toFixed(2)}</small>
      </label>
    </div>
  );
}
