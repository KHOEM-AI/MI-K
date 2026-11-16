import { Sun, Moon, Lightbulb } from "lucide-react";

type LightingPreset = "day" | "night" | "studio";

type SceneLightingPanelProps = {
  activeLighting: LightingPreset | null;
  setLightingPreset: (preset: LightingPreset) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  useEnvMap: boolean;
  setUseEnvMap: (value: boolean) => void;
  ambientIntensity: number;
  setAmbientIntensity: (value: number) => void;
  directionalIntensity: number;
  setDirectionalIntensity: (value: number) => void;
  setActiveLighting: (value: LightingPreset | null) => void;
};

export function SceneLightingPanel({
  activeLighting,
  setLightingPreset,
  bgColor,
  setBgColor,
  useEnvMap,
  setUseEnvMap,
  ambientIntensity,
  setAmbientIntensity,
  directionalIntensity,
  setDirectionalIntensity,
  setActiveLighting,
}: SceneLightingPanelProps) {
  return (
    <div className="studio-transform-panel">
      <h3>Scene Lighting</h3>

      <div
        className="studio-controls"
        style={{ marginBottom: "8px", display: "flex", gap: "8px" }}
      >
        <button
          type="button"
          className={activeLighting === "day" ? "upload-button" : "filter"}
          onClick={() => setLightingPreset("day")}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Sun size={16} color="#fbbf24" /> Day
        </button>

        <button
          type="button"
          className={activeLighting === "night" ? "upload-button" : "filter"}
          onClick={() => setLightingPreset("night")}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Moon size={16} color="#818cf8" /> Night
        </button>

        <button
          type="button"
          className={activeLighting === "studio" ? "upload-button" : "filter"}
          onClick={() => setLightingPreset("studio")}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Lightbulb size={16} color="#facc15" /> Studio
        </button>
      </div>

      <div className="studio-controls" style={{ marginBottom: "8px" }}>
        <label>
          Background Color
          <input
            type="color"
            value={bgColor}
            onChange={(event) => setBgColor(event.target.value)}
          />
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          <input
            type="checkbox"
            checked={useEnvMap}
            onChange={(event) => setUseEnvMap(event.target.checked)}
          />
          HDRI Reflections
        </label>
      </div>

      <div className="studio-controls">
        <label>
          Ambient Light: {ambientIntensity.toFixed(2)}
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={ambientIntensity}
            onChange={(event) => {
              setAmbientIntensity(Number(event.target.value));
              setActiveLighting(null);
            }}
          />
        </label>

        <label>
          Directional Light: {directionalIntensity.toFixed(2)}
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={directionalIntensity}
            onChange={(event) => {
              setDirectionalIntensity(Number(event.target.value));
              setActiveLighting(null);
            }}
          />
        </label>
      </div>
    </div>
  );
}
