import type { SceneObject, Vector3 } from "./studioTypes";

type TransformPanelProps = {
  selectedObject: SceneObject;
  updateSelected: (
    key: "position" | "rotation" | "scale",
    axis: keyof Vector3,
    value: number
  ) => void;
  centerAndFitObject: () => void;
  duplicateObject: () => void;
  deleteObject: () => void;
  commitObjects: (next: SceneObject[]) => void;
  objects: SceneObject[];
};

function renderVectorControls(
  title: string,
  key: "position" | "rotation" | "scale",
  values: Vector3,
  step: number,
  disabled: boolean | undefined,
  onChange: (
    key: "position" | "rotation" | "scale",
    axis: keyof Vector3,
    value: number
  ) => void
) {
  return (
    <div className="studio-transform-group">
      <h4>{title}</h4>
      <div className="studio-transform-grid">
        {(["x", "y", "z"] as const).map((axis) => (
          <label key={axis}>
            {axis.toUpperCase()}
            <input
              type="number"
              step={step}
              value={Number(values[axis].toFixed(3))}
              onChange={(event) =>
                onChange(key, axis, Number(event.target.value))
              }
              disabled={disabled}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function TransformPanel({
  selectedObject,
  updateSelected,
  centerAndFitObject,
  duplicateObject,
  deleteObject,
  commitObjects,
  objects,
}: TransformPanelProps) {
  return (
    <div className="studio-transform-panel">
      <h3>Transform: {selectedObject.name}</h3>

      {selectedObject.locked && (
        <p className="studio-note" style={{ color: "#f0b849", marginBottom: "8px" }}>
          🔒 វត្ថុនេះកំពុងត្រូវបានចាក់សោ។ សូមដោះសោដើម្បីកែប្រែ។
        </p>
      )}

      {selectedObject.shape === "text" && (
        <div className="studio-controls" style={{ marginBottom: "8px" }}>
          <label style={{ width: "100%" }}>
            Text Content
            <input
              type="text"
              value={selectedObject.text || ""}
              onChange={(event) => {
                commitObjects(
                  objects.map((item) =>
                    item.id === selectedObject.id
                      ? { ...item, text: event.target.value }
                      : item
                  )
                );
              }}
              disabled={selectedObject.locked}
            />
          </label>
        </div>
      )}

      <div className="studio-controls">
        <button
          type="button"
          className="upload-button"
          onClick={centerAndFitObject}
        >
          Fit to Center
        </button>
        <button
          type="button"
          className="upload-button"
          onClick={duplicateObject}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="upload-button"
          onClick={deleteObject}
        >
          Delete
        </button>
      </div>

      {renderVectorControls(
        "Move Position",
        "position",
        selectedObject.position,
        0.1,
        selectedObject.locked,
        updateSelected
      )}

      {renderVectorControls(
        "Rotate (Radians)",
        "rotation",
        selectedObject.rotation,
        0.1,
        selectedObject.locked,
        updateSelected
      )}

      {renderVectorControls(
        "Scale",
        "scale",
        selectedObject.scale,
        0.1,
        selectedObject.locked,
        updateSelected
      )}
    </div>
  );
}
