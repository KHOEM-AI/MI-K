import { Route, Construction, TrafficCone, Lamp } from "lucide-react";
import type { Shape } from "./studioTypes";

type RoadElementsPanelProps = {
  onAdd: (shape: Shape) => void;
  disabled?: boolean;
};

const ELEMENTS = [
  { shape: "highway" as Shape, name: "Highway", icon: Route },
  { shape: "bridge" as Shape, name: "Bridge", icon: Construction },
  { shape: "trafficlight" as Shape, name: "Traffic Light", icon: TrafficCone },
  { shape: "streetlight" as Shape, name: "Street Light", icon: Lamp },
];

export function RoadElementsPanel({ onAdd, disabled }: RoadElementsPanelProps) {
  return (
    <div className="studio-transform-panel">
      <h3>Road Elements</h3>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {ELEMENTS.map((el) => {
          const Icon = el.icon;
          return (
            <button
              key={el.shape}
              type="button"
              className="upload-button"
              disabled={disabled}
              onClick={() => onAdd(el.shape)}
              style={{ flex: "1 1 calc(33% - 4px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", gap: "4px" }}
            >
              <Icon size={20} />
              <span style={{ fontSize: "0.8rem" }}>{el.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
